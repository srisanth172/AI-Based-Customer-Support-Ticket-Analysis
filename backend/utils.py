import re
from collections import Counter
from datetime import datetime, timezone


STOPWORDS = {
	"the",
	"a",
	"an",
	"and",
	"or",
	"to",
	"for",
	"of",
	"in",
	"is",
	"it",
	"this",
	"that",
	"with",
	"on",
	"i",
	"my",
	"me",
}


def utcnow() -> datetime:
	return datetime.now(timezone.utc)


def preprocess_text(text: str) -> str:
	cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", (text or "").lower())
	return re.sub(r"\s+", " ", cleaned).strip()


def tokenize_text(text: str) -> list[str]:
	normalized = preprocess_text(text)
	if not normalized:
		return []
	return [token for token in normalized.split(" ") if token and token not in STOPWORDS]


def extract_keywords(text: str, top_k: int = 5) -> list[str]:
	tokens = tokenize_text(text)
	frequency = Counter(tokens)
	return [token for token, _ in frequency.most_common(top_k)]


def clamp_confidence(score: float) -> float:
	return max(0.0, min(1.0, float(score)))
