from sqlalchemy.orm import Session
from sqlalchemy import or_

from ai_module import (
	analyze_sentiment,
	find_duplicate_ticket,
	identify_recurring_issues,
	predict_category,
)
from models import Ticket, TicketHistory
from utils import preprocess_text, utcnow

import secrets
from difflib import SequenceMatcher


VALID_STATUSES = {"open", "in-progress", "resolved"}


def serialize_ticket(ticket: Ticket) -> dict:
	return {
		"ticket_id": ticket.ticket_uid,
		"internal_id": ticket.id,
		"title": ticket.title,
		"description": ticket.description,
		"category": ticket.category,
		"sentiment": ticket.sentiment,
		"priority_score": ticket.priority_score,
		"priority_level": ticket.priority_level,
		"status": ticket.status,
		"is_duplicate": ticket.is_duplicate,
		"duplicate_of_id": ticket.duplicate_of_id,
		"similar_count": ticket.similar_count,
		"escalation_reason": ticket.escalation_reason,
		"customer_email": ticket.customer_email,
		"created_at": ticket.created_at.isoformat() if ticket.created_at else None,
		"updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
	}


def _generate_ticket_uid(db: Session) -> str:
	while True:
		candidate = f"TKT-{secrets.token_hex(3).upper()}"
		exists = db.query(Ticket).filter(Ticket.ticket_uid == candidate).first()
		if not exists:
			return candidate


def _text_similarity(first: str, second: str) -> float:
	return float(SequenceMatcher(None, preprocess_text(first), preprocess_text(second)).ratio())


def _compute_similar_count(description: str, tickets: list[Ticket]) -> int:
	if not description:
		return 0

	count = 0
	for ticket in tickets:
		if _text_similarity(description, ticket.description) >= 0.55:
			count += 1
	return count


def _priority_level(score: int) -> str:
	if score >= 11:
		return "high"
	if score >= 6:
		return "medium"
	return "low"


def _days_open(ticket: Ticket) -> int:
	if not ticket.created_at:
		return 0
	created_at = ticket.created_at
	now = utcnow()

	if created_at.tzinfo is None:
		now = now.replace(tzinfo=None)
	else:
		now = now.astimezone(created_at.tzinfo)

	delta = now - created_at
	return max(0, int(delta.days))


def _calculate_priority(sentiment: str, category: str, similar_count: int, open_days: int) -> int:
	score = 0
	normalized_sentiment = (sentiment or "").strip().lower()
	normalized_category = (category or "").strip().lower()

	if normalized_sentiment == "negative":
		score += 5
	elif normalized_sentiment == "neutral":
		score += 3
	else:
		score += 1

	if open_days >= 4:
		score += 5
	elif open_days >= 2:
		score += 3
	else:
		score += 1

	if normalized_category == "technical":
		score += 4
	elif normalized_category == "billing":
		score += 3
	else:
		score += 1

	# Similar complaints raise urgency for repeated customer issues.
	if similar_count >= 3:
		score += 4
	elif similar_count >= 1:
		score += 2

	return max(0, score)


def _apply_priority_and_escalation(ticket: Ticket, similar_count: int, force_escalate: bool = False) -> None:
	open_days = _days_open(ticket)
	if ticket.status == "resolved":
		ticket.escalation_reason = None
	elif force_escalate:
		ticket.escalation_reason = "customer_requested_human"
	elif ticket.sentiment == "negative":
		ticket.escalation_reason = "negative_sentiment"
	elif open_days >= 4:
		ticket.escalation_reason = "open_too_long"
	else:
		ticket.escalation_reason = None

	ticket.similar_count = similar_count
	ticket.priority_score = _calculate_priority(ticket.sentiment, ticket.category, similar_count, open_days)
	ticket.priority_level = _priority_level(ticket.priority_score)
	ticket.updated_at = utcnow()


def create_ticket(
	db: Session,
	title: str,
	description: str,
	category: str | None = None,
	customer_email: str | None = None,
	force_escalate: bool = False,
) -> tuple[Ticket, dict]:
	predicted_category, confidence = predict_category(description)
	final_category = (category or "").strip() or predicted_category
	sentiment = analyze_sentiment(description)

	existing_tickets = db.query(Ticket).order_by(Ticket.id.asc()).all()
	historical_texts = [ticket.description for ticket in existing_tickets]
	is_duplicate, duplicate_index, duplicate_score = find_duplicate_ticket(description, historical_texts)
	duplicate_of_id = existing_tickets[duplicate_index].id if is_duplicate and duplicate_index is not None else None
	similar_count = _compute_similar_count(description, existing_tickets)

	now = utcnow()
	ticket = Ticket(
		ticket_uid=_generate_ticket_uid(db),
		title=title.strip(),
		description=description.strip(),
		category=final_category,
		sentiment=sentiment,
		status="open",
		priority_score=0,
		priority_level="low",
		is_duplicate=is_duplicate,
		duplicate_of_id=duplicate_of_id,
		similar_count=similar_count,
		escalation_reason=None,
		customer_email=(customer_email or "").strip().lower() or None,
		created_at=now,
		updated_at=now,
	)
	_apply_priority_and_escalation(ticket, similar_count=similar_count, force_escalate=force_escalate)
	db.add(ticket)
	db.flush()

	db.add(
		TicketHistory(
			ticket_id=ticket.id,
			action="created",
			notes=(
				f"Ticket created with sentiment={sentiment}, category={final_category}, "
				f"priority={ticket.priority_level}({ticket.priority_score})"
			),
		)
	)
	db.commit()
	db.refresh(ticket)

	metadata = {
		"ticket_uid": ticket.ticket_uid,
		"predicted_category": predicted_category,
		"prediction_confidence": confidence,
		"duplicate_score": round(duplicate_score, 4),
		"is_duplicate": is_duplicate,
		"duplicate_of_id": duplicate_of_id,
		"priority_score": ticket.priority_score,
		"priority_level": ticket.priority_level,
		"escalation_reason": ticket.escalation_reason,
	}
	return ticket, metadata


def _sort_ticket_records(records: list[Ticket]) -> list[Ticket]:
	status_rank = {
		"open": 0,
		"escalated": 0,
		"in-progress": 1,
		"resolved": 3,
	}

	return sorted(
		records,
		key=lambda ticket: (
			1 if ticket.status == "resolved" else 0,
			-ticket.priority_score,
			status_rank.get(ticket.status, 10),
			ticket.created_at or utcnow(),
		),
	)


def list_tickets(db: Session) -> list[dict]:
	tickets = db.query(Ticket).order_by(Ticket.created_at.asc()).all()

	for ticket in tickets:
		similar_count = _compute_similar_count(
			ticket.description,
			[existing for existing in tickets if existing.id != ticket.id],
		)
		_apply_priority_and_escalation(ticket, similar_count=similar_count, force_escalate=False)

	db.commit()

	sorted_tickets = _sort_ticket_records(tickets)
	return [serialize_ticket(ticket) for ticket in sorted_tickets]


def update_ticket_status(db: Session, ticket_reference: str, status: str) -> tuple[dict | None, str | None]:
	normalized_status = (
		(status or "")
		.strip()
		.lower()
		.replace("_", "-")
		.replace(" ", "-")
	)
	if normalized_status == "inprogress":
		normalized_status = "in-progress"
	if normalized_status not in VALID_STATUSES:
		return None, "Invalid status. Use one of: open, in-progress, resolved."

	reference = str(ticket_reference or "").strip()
	if not reference:
		return None, "Ticket not found."

	filters = [Ticket.ticket_uid == reference]
	if reference.isdigit():
		filters.append(Ticket.id == int(reference))

	ticket = db.query(Ticket).filter(or_(*filters)).first()
	if not ticket:
		return None, "Ticket not found."

	ticket.status = normalized_status
	ticket.escalation_reason = None

	similar_count = _compute_similar_count(
		ticket.description,
		[existing for existing in db.query(Ticket).all() if existing.id != ticket.id],
	)
	_apply_priority_and_escalation(ticket, similar_count=similar_count, force_escalate=False)
	db.add(TicketHistory(ticket_id=ticket.id, action="status_updated", notes=f"Status changed to {normalized_status}"))
	db.commit()
	db.refresh(ticket)

	return serialize_ticket(ticket), None


def get_ticket_by_uid(db: Session, ticket_uid: str) -> dict | None:
	ticket = db.query(Ticket).filter(Ticket.ticket_uid == ticket_uid.strip()).first()
	if not ticket:
		return None

	similar_count = _compute_similar_count(
		ticket.description,
		[existing for existing in db.query(Ticket).all() if existing.id != ticket.id],
	)
	_apply_priority_and_escalation(ticket, similar_count=similar_count, force_escalate=False)
	db.commit()
	db.refresh(ticket)
	return serialize_ticket(ticket)


def recurring_issue_report(db: Session) -> list[dict]:
	tickets = db.query(Ticket).all()
	lightweight = [{"title": ticket.title, "category": ticket.category} for ticket in tickets]
	return identify_recurring_issues(lightweight)


def dashboard_metrics(db: Session) -> dict:
	records = list_tickets(db)
	status_counts = {
		"open": 0,
		"in-progress": 0,
		"resolved": 0,
		"escalated": 0,
	}
	sentiment_counts = {
		"positive": 0,
		"neutral": 0,
		"negative": 0,
	}

	for ticket in records:
		status = ticket.get("status", "open")
		sentiment = ticket.get("sentiment", "neutral")
		if status in status_counts:
			status_counts[status] += 1
		if sentiment in sentiment_counts:
			sentiment_counts[sentiment] += 1

	return {
		"total_tickets": len(records),
		"open_tickets": status_counts["open"],
		"negative_sentiment_count": sentiment_counts["negative"],
		"status_counts": status_counts,
		"sentiment_counts": sentiment_counts,
	}
