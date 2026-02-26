from collections import Counter

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics.pairwise import cosine_similarity
from textblob import TextBlob

from utils import clamp_confidence, preprocess_text


SAMPLE_TICKET_DATA = [
    {"text": "payment failed and charged twice", "category": "Billing"},
    {"text": "unable to login with valid password", "category": "Account"},
    {"text": "site is slow and crashes frequently", "category": "Technical"},
    {"text": "need invoice for last month", "category": "Billing"},
    {"text": "reset password email not received", "category": "Account"},
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
        return "Neutral"

    sentiment = TextBlob(content).sentiment
    polarity = float(getattr(sentiment, "polarity", 0.0))
    if polarity > 0.15:
        return "Positive"
    if polarity < -0.15:
        return "Negative"
    return "Neutral"


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
    content = preprocess_text(user_message)
    if not content:
        return "Please share a little more detail so I can help you better.", 0.35

    if any(keyword in content for keyword in ["refund", "charged", "billing", "invoice"]):
        return "I can help with billing. Please share your order ID or invoice number.", 0.83
    if any(keyword in content for keyword in ["login", "password", "account", "sign in"]):
        return "For account access, please try password reset and confirm if 2FA is enabled.", 0.79
    if any(keyword in content for keyword in ["error", "crash", "bug", "not working"]):
        return "Please share the exact error message and device/browser details.", 0.76

    return "I can route this to a support agent. Can you provide more context?", 0.49
