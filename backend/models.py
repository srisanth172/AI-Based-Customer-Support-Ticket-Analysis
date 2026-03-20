from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, create_engine, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

from config import settings
from utils import utcnow


class Base(DeclarativeBase):
	pass


engine = create_engine(settings.database_url, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class User(Base):
	__tablename__ = "users"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	username: Mapped[str | None] = mapped_column(String(64), unique=True, index=True, nullable=True)
	email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
	password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
	role: Mapped[str] = mapped_column(String(32), nullable=False, default="customer")
	is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
	updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

	tickets: Mapped[list["Ticket"]] = relationship(back_populates="owner")


class Ticket(Base):
	__tablename__ = "tickets"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	ticket_uid: Mapped[str | None] = mapped_column(String(24), unique=True, index=True, nullable=True)
	title: Mapped[str] = mapped_column(String(255), nullable=False)
	description: Mapped[str] = mapped_column(Text, nullable=False)
	category: Mapped[str] = mapped_column(String(100), nullable=False)
	sentiment: Mapped[str] = mapped_column(String(32), nullable=False)
	priority_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
	priority_level: Mapped[str] = mapped_column(String(16), nullable=False, default="low")
	status: Mapped[str] = mapped_column(String(32), nullable=False, default="open")
	is_duplicate: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
	similar_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
	escalation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
	duplicate_of_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("tickets.id"), nullable=True)
	customer_email: Mapped[str | None] = mapped_column(String(255), ForeignKey("users.email"), nullable=True)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
	updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

	owner: Mapped[User | None] = relationship(back_populates="tickets")
	history: Mapped[list["TicketHistory"]] = relationship(back_populates="ticket", cascade="all, delete-orphan")


class TicketHistory(Base):
	__tablename__ = "ticket_history"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	ticket_id: Mapped[int] = mapped_column(ForeignKey("tickets.id"), nullable=False, index=True)
	action: Mapped[str] = mapped_column(String(100), nullable=False)
	notes: Mapped[str | None] = mapped_column(Text, nullable=True)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

	ticket: Mapped[Ticket] = relationship(back_populates="history")


def init_db() -> None:
	Base.metadata.create_all(bind=engine)
	_migrate_existing_schema()


def _column_exists(table_name: str, column_name: str) -> bool:
	with engine.begin() as connection:
		result = connection.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
		columns = [row[1] for row in result]
		return column_name in columns


def _index_exists(index_name: str) -> bool:
	with engine.begin() as connection:
		rows = connection.execute(text("SELECT name FROM sqlite_master WHERE type='index' AND name=:name"), {"name": index_name}).fetchall()
		return len(rows) > 0


def _migrate_existing_schema() -> None:
	with engine.begin() as connection:
		if not _column_exists("users", "username"):
			connection.execute(text("ALTER TABLE users ADD COLUMN username VARCHAR(64)"))
		if not _column_exists("users", "updated_at"):
			connection.execute(text("ALTER TABLE users ADD COLUMN updated_at DATETIME"))

		if not _column_exists("tickets", "ticket_uid"):
			connection.execute(text("ALTER TABLE tickets ADD COLUMN ticket_uid VARCHAR(24)"))
		if not _column_exists("tickets", "priority_score"):
			connection.execute(text("ALTER TABLE tickets ADD COLUMN priority_score INTEGER NOT NULL DEFAULT 0"))
		if not _column_exists("tickets", "priority_level"):
			connection.execute(text("ALTER TABLE tickets ADD COLUMN priority_level VARCHAR(16) NOT NULL DEFAULT 'low'"))
		if not _column_exists("tickets", "similar_count"):
			connection.execute(text("ALTER TABLE tickets ADD COLUMN similar_count INTEGER NOT NULL DEFAULT 0"))
		if not _column_exists("tickets", "escalation_reason"):
			connection.execute(text("ALTER TABLE tickets ADD COLUMN escalation_reason TEXT"))

		connection.execute(text("UPDATE users SET updated_at = COALESCE(updated_at, created_at)"))
		connection.execute(text("UPDATE tickets SET ticket_uid = COALESCE(ticket_uid, 'LEGACY-' || id)"))

		if not _index_exists("ix_users_username"):
			connection.execute(text("CREATE UNIQUE INDEX ix_users_username ON users (username)"))
		if not _index_exists("ix_tickets_ticket_uid"):
			connection.execute(text("CREATE UNIQUE INDEX ix_tickets_ticket_uid ON tickets (ticket_uid)"))
