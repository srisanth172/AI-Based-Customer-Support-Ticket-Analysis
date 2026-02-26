from sqlalchemy.orm import Session

from ai_module import (
	analyze_sentiment,
	find_duplicate_ticket,
	identify_recurring_issues,
	predict_category,
)
from models import Ticket, TicketHistory
from utils import utcnow


VALID_STATUSES = {"open", "in-progress", "resolved"}


def serialize_ticket(ticket: Ticket) -> dict:
	return {
		"ticket_id": ticket.id,
		"title": ticket.title,
		"description": ticket.description,
		"category": ticket.category,
		"sentiment": ticket.sentiment,
		"status": ticket.status,
		"is_duplicate": ticket.is_duplicate,
		"duplicate_of_id": ticket.duplicate_of_id,
		"customer_email": ticket.customer_email,
		"created_at": ticket.created_at.isoformat() if ticket.created_at else None,
		"updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
	}


def create_ticket(
	db: Session,
	title: str,
	description: str,
	category: str | None = None,
	customer_email: str | None = None,
) -> tuple[Ticket, dict]:
	predicted_category, confidence = predict_category(description)
	final_category = (category or "").strip() or predicted_category
	sentiment = analyze_sentiment(description)

	existing_tickets = db.query(Ticket).order_by(Ticket.id.asc()).all()
	historical_texts = [ticket.description for ticket in existing_tickets]
	is_duplicate, duplicate_index, duplicate_score = find_duplicate_ticket(description, historical_texts)
	duplicate_of_id = existing_tickets[duplicate_index].id if is_duplicate and duplicate_index is not None else None

	now = utcnow()
	ticket = Ticket(
		title=title.strip(),
		description=description.strip(),
		category=final_category,
		sentiment=sentiment,
		status="open",
		is_duplicate=is_duplicate,
		duplicate_of_id=duplicate_of_id,
		customer_email=(customer_email or "").strip().lower() or None,
		created_at=now,
		updated_at=now,
	)
	db.add(ticket)
	db.flush()

	db.add(
		TicketHistory(
			ticket_id=ticket.id,
			action="created",
			notes=f"Ticket created with sentiment={sentiment} and category={final_category}",
		)
	)
	db.commit()
	db.refresh(ticket)

	metadata = {
		"predicted_category": predicted_category,
		"prediction_confidence": confidence,
		"duplicate_score": round(duplicate_score, 4),
		"is_duplicate": is_duplicate,
		"duplicate_of_id": duplicate_of_id,
	}
	return ticket, metadata


def list_tickets(db: Session) -> list[dict]:
	tickets = db.query(Ticket).order_by(Ticket.created_at.desc()).all()
	return [serialize_ticket(ticket) for ticket in tickets]


def update_ticket_status(db: Session, ticket_id: int, status: str) -> tuple[dict | None, str | None]:
	normalized_status = (status or "").strip().lower()
	if normalized_status not in VALID_STATUSES:
		return None, "Invalid status. Use one of: open, in-progress, resolved."

	ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
	if not ticket:
		return None, "Ticket not found."

	ticket.status = normalized_status
	ticket.updated_at = utcnow()
	db.add(TicketHistory(ticket_id=ticket.id, action="status_updated", notes=f"Status changed to {normalized_status}"))
	db.commit()
	db.refresh(ticket)

	return serialize_ticket(ticket), None


def recurring_issue_report(db: Session) -> list[dict]:
	tickets = db.query(Ticket).all()
	lightweight = [{"title": ticket.title, "category": ticket.category} for ticket in tickets]
	return identify_recurring_issues(lightweight)
