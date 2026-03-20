from collections import Counter
import json
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics.pairwise import cosine_similarity
from textblob import TextBlob

from config import settings
from utils import clamp_confidence, preprocess_text


SAMPLE_TICKET_DATA = [
    {"text": "payment failed and charged twice", "category": "Billing"},
    {"text": "unable to login with valid password", "category": "Technical"},
    {"text": "site is slow and crashes frequently", "category": "Technical"},
    {"text": "need invoice for last month", "category": "Billing"},
    {"text": "reset password email not received", "category": "General"},
    {"text": "api integration returns server error", "category": "Technical"},
    {"text": "want to update plan and pricing", "category": "General"},
    {"text": "how to cancel subscription", "category": "General"},
]


_category_vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
_category_model = LogisticRegression(max_iter=1200)
_is_model_trained = False


def train_category_model(records: list[dict] | None = None) -> None:
    global _is_model_trained
    dataset = records or SAMPLE_TICKET_DATA
    texts = [preprocess_text(item.get("text", "")) for item in dataset if item.get("text")]
    labels = [item.get("category", "General") for item in dataset if item.get("text")]
    if not texts:
        return

    vectors = _category_vectorizer.fit_transform(texts)
    _category_model.fit(vectors, labels)
    _is_model_trained = True


def predict_category(text: str) -> tuple[str, float]:
    if not _is_model_trained:
        train_category_model()

    normalized = preprocess_text(text)
    if not normalized:
        return "General", 0.0

    vector = _category_vectorizer.transform([normalized])
    probabilities = _category_model.predict_proba(vector)[0]
    max_index = int(probabilities.argmax())
    category = str(_category_model.classes_[max_index])
    confidence = clamp_confidence(float(probabilities[max_index]))
    return category, confidence


def analyze_sentiment(text: str) -> str:
    content = (text or "").strip()
    if not content:
        return "neutral"

    sentiment = TextBlob(content).sentiment
    polarity = float(getattr(sentiment, "polarity", 0.0))
    if polarity > 0.15:
        return "positive"
    if polarity < -0.15:
        return "negative"
    return "neutral"


def find_duplicate_ticket(text: str, historical_texts: list[str], threshold: float = 0.78) -> tuple[bool, int | None, float]:
    normalized_current = preprocess_text(text)
    cleaned_historical = [preprocess_text(item) for item in historical_texts if item]
    if not normalized_current or not cleaned_historical:
        return False, None, 0.0

    vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
    history_matrix = vectorizer.fit_transform(cleaned_historical)
    current_vector = vectorizer.transform([normalized_current])
    scores = cosine_similarity(current_vector, history_matrix)[0]

    best_index = int(scores.argmax())
    best_score = float(scores[best_index])
    if best_score >= threshold:
        return True, best_index, best_score
    return False, None, best_score


def identify_recurring_issues(tickets: list[dict], minimum_count: int = 2) -> list[dict]:
    grouped_keys: list[str] = []
    for ticket in tickets:
        title = preprocess_text(ticket.get("title", ""))
        category = ticket.get("category", "General")
        grouped_keys.append(f"{category}:{title}")

    counts = Counter(grouped_keys)
    recurring = []
    for key, count in counts.items():
        if count >= minimum_count and ":" in key:
            category, title = key.split(":", 1)
            recurring.append({"category": category, "issue": title, "count": count})

    return sorted(recurring, key=lambda item: item["count"], reverse=True)


def generate_chat_response(user_message: str) -> tuple[str, float]:
    result = generate_chat_intelligence(user_message=user_message, conversation=[])
    return result["reply"], float(result["confidence"])


def _local_chat_fallback(user_message: str) -> dict:
    message = (user_message or "").strip()
    normalized = preprocess_text(message)
    sentiment = analyze_sentiment(message)
    predicted_category, model_confidence = predict_category(message)

    lower_message = message.lower()
    complaint_markers = (
        "not working",
        "problem",
        "issue",
        "error",
        "failed",
        "frustrated",
        "angry",
        "bug",
        "broken",
    )
    human_markers = (
        "human",
        "agent",
        "representative",
        "real person",
        "support team",
        "talk to someone",
    )

    complaint_detected = sentiment == "negative" or any(marker in lower_message for marker in complaint_markers)
    wants_human_agent = any(marker in lower_message for marker in human_markers)

    if not normalized:
        reply = "I can help with billing, technical, or general support questions. Please share a quick summary of your issue."
    elif any(word in lower_message for word in ("hello", "hi", "hey", "good morning", "good evening")):
        reply = "Hello. Tell me what went wrong, and I will guide you or create a support ticket if needed."
    elif predicted_category == "Billing":
        reply = (
            "It looks like a billing request. Please include your account email, invoice date, and what appears incorrect. "
            "I can also open a support ticket for faster follow-up."
        )
    elif predicted_category == "Technical":
        reply = (
            "It looks like a technical issue. Please share the exact steps to reproduce it and any error text you see. "
            "I can create a support ticket right away if you want."
        )
    else:
        reply = (
            "Thanks for the details. I can help you here, or I can create a support ticket so the support team can follow up."
        )

    if complaint_detected or wants_human_agent:
        reply = f"{reply}\n\nWould you like me to create a support ticket for this issue?"

    return {
        "reply": reply,
        "complaint_detected": complaint_detected,
        "wants_human_agent": wants_human_agent,
        "confidence": max(0.55, min(0.9, float(model_confidence) or 0.65)),
        "suggested_title": f"{predicted_category} support request: {message[:64]}".strip(),
        "suggested_category": predicted_category,
        "fallback_mode": True,
    }


def _call_openrouter(messages: list[dict[str, str]], temperature: float = 0.35) -> str:
    if not settings.openrouter_api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not configured.")

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "HTTP-Referer": settings.openrouter_site_url,
        "X-Title": settings.openrouter_app_name,
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.openrouter_model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": 500,
    }

    request = Request(
        url="https://openrouter.ai/api/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )

    try:
        with urlopen(request, timeout=45) as response:
            body = json.loads(response.read().decode("utf-8"))
            return str(body["choices"][0]["message"]["content"])
    except HTTPError as error:
        error_text = error.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"OpenRouter HTTP error: {error.code} {error_text}") from error
    except URLError as error:
        raise RuntimeError(f"OpenRouter network error: {error}") from error


def _extract_json(content: str) -> dict[str, Any]:
    raw = (content or "").strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        raw = raw.replace("json", "", 1).strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(raw[start : end + 1])
        raise


def generate_chat_intelligence(user_message: str, conversation: list[dict] | None = None) -> dict:
    history = conversation or []
    history_context = "\n".join(
        [f"{entry.get('role', 'user')}: {entry.get('content', '')}" for entry in history[-8:]]
    )

    system_prompt = (
        "You are a customer support AI assistant. Respond naturally and concisely. "
        "Analyze if the message is a complaint and if the user asks for a human agent. "
        "Return strict JSON with keys: reply, complaint_detected, wants_human_agent, confidence, "
        "suggested_title, suggested_category. Confidence should be between 0 and 1. "
        "Categories must be one of Billing, Technical, General."
    )

    user_prompt = (
        "Conversation history:\n"
        f"{history_context or 'none'}\n\n"
        "Current message:\n"
        f"{user_message}"
    )

    try:
        response_content = _call_openrouter(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.45,
        )
        payload = _extract_json(response_content)

        reply = str(payload.get("reply", "")).strip() or "Could you share a little more detail?"
        complaint_detected = bool(payload.get("complaint_detected", False))
        wants_human_agent = bool(payload.get("wants_human_agent", False))
        confidence = clamp_confidence(float(payload.get("confidence", 0.5)))
        suggested_title = str(payload.get("suggested_title", "Support request")).strip() or "Support request"
        suggested_category = str(payload.get("suggested_category", "General")).strip().title()
        if suggested_category not in {"Billing", "Technical", "General"}:
            suggested_category = "General"

        return {
            "reply": reply,
            "complaint_detected": complaint_detected,
            "wants_human_agent": wants_human_agent,
            "confidence": confidence,
            "suggested_title": suggested_title,
            "suggested_category": suggested_category,
        }
    except Exception as error:
        fallback = _local_chat_fallback(user_message)
        fallback["error"] = str(error)
        return fallback


def _local_confirmation_decision(message: str) -> str:
    lower = (message or "").strip().lower()
    if not lower:
        return "unclear"

    yes_phrases = (
        "yes",
        "y",
        "yeah",
        "yep",
        "sure",
        "ok",
        "okay",
        "please do",
        "go ahead",
        "create ticket",
        "do it",
    )
    no_phrases = (
        "no",
        "n",
        "nope",
        "nah",
        "not now",
        "dont",
        "don't",
        "do not",
        "cancel",
    )

    if any(phrase in lower for phrase in yes_phrases):
        return "yes"
    if any(phrase in lower for phrase in no_phrases):
        return "no"
    return "unclear"


def classify_ticket_confirmation(message: str) -> str:
    prompt = (
        "Classify the user's reply in JSON with one key 'decision'. "
        "decision must be one of: yes, no, unclear. "
        "User reply: "
        f"{message}"
    )

    try:
        response_content = _call_openrouter(
            messages=[
                {"role": "system", "content": "You classify intent strictly."},
                {"role": "user", "content": prompt},
            ],
            temperature=0,
        )
        payload = _extract_json(response_content)
        decision = str(payload.get("decision", "unclear")).strip().lower()
        if decision not in {"yes", "no", "unclear"}:
            return _local_confirmation_decision(message)
        return decision
    except Exception:
        return _local_confirmation_decision(message)
