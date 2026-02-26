from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, create_engine
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
	email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
	password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
	role: Mapped[str] = mapped_column(String(32), nullable=False, default="customer")
	is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

	tickets: Mapped[list["Ticket"]] = relationship(back_populates="owner")


class Ticket(Base):
	__tablename__ = "tickets"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	title: Mapped[str] = mapped_column(String(255), nullable=False)
	description: Mapped[str] = mapped_column(Text, nullable=False)
	category: Mapped[str] = mapped_column(String(100), nullable=False)
	sentiment: Mapped[str] = mapped_column(String(32), nullable=False)
	status: Mapped[str] = mapped_column(String(32), nullable=False, default="open")
	is_duplicate: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
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
