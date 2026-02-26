from functools import wraps

from flask import g, jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy.orm import Session
from werkzeug.security import check_password_hash, generate_password_hash

from config import settings
from models import User


ALLOWED_ROLES = {"customer", "agent", "admin"}
_serializer = URLSafeTimedSerializer(settings.secret_key)


def hash_password(password: str) -> str:
	return generate_password_hash(password)


def verify_password(password: str, password_hash: str) -> bool:
	return check_password_hash(password_hash, password)


def _generate_token(payload: dict, salt: str) -> str:
	return _serializer.dumps(payload, salt=salt)


def _decode_token(token: str, salt: str, max_age: int) -> dict | None:
	try:
		return _serializer.loads(token, salt=salt, max_age=max_age)
	except (BadSignature, SignatureExpired):
		return None


def create_email_verification_token(email: str) -> str:
	return _generate_token({"email": email}, salt="email-verify")


def verify_email_token(token: str) -> str | None:
	payload = _decode_token(token, salt="email-verify", max_age=settings.token_expiry_seconds)
	return payload.get("email") if payload else None


def create_access_token(user: User) -> str:
	payload = {"email": user.email, "role": user.role}
	return _generate_token(payload, salt="auth")


def decode_access_token(token: str) -> dict | None:
	return _decode_token(token, salt="auth", max_age=settings.token_expiry_seconds)


def register_user(db: Session, email: str, password: str, role: str = "customer") -> tuple[User | None, str | None, str | None]:
	normalized_email = (email or "").strip().lower()
	selected_role = (role or "customer").strip().lower()

	if selected_role not in ALLOWED_ROLES:
		return None, None, "Invalid role. Allowed roles: customer, agent, admin."

	if db.query(User).filter(User.email == normalized_email).first():
		return None, None, "Email is already registered."

	user = User(
		email=normalized_email,
		password_hash=hash_password(password),
		role=selected_role,
		is_verified=False,
	)
	db.add(user)
	db.commit()
	db.refresh(user)

	verification_token = create_email_verification_token(user.email)
	return user, verification_token, None


def confirm_user_email(db: Session, token: str) -> tuple[bool, str]:
	email = verify_email_token(token)
	if not email:
		return False, "Invalid or expired verification token."

	user = db.query(User).filter(User.email == email).first()
	if not user:
		return False, "User not found for this token."

	user.is_verified = True
	db.commit()
	return True, "Email verified successfully."


def login_user(db: Session, email: str, password: str) -> tuple[str | None, str | None]:
	user = db.query(User).filter(User.email == (email or "").strip().lower()).first()
	if not user or not verify_password(password, user.password_hash):
		return None, "Invalid credentials."
	if not user.is_verified:
		return None, "Email not verified yet."

	return create_access_token(user), None


def authenticate_request(db: Session) -> dict | None:
	auth_header = request.headers.get("Authorization", "")
	if not auth_header.startswith("Bearer "):
		return None

	token = auth_header.split(" ", 1)[1].strip()
	payload = decode_access_token(token)
	if not payload:
		return None

	user = db.query(User).filter(User.email == payload.get("email")).first()
	if not user:
		return None

	g.current_user = {"email": user.email, "role": user.role}
	return g.current_user


def role_required(*roles: str):
	expected = {role.strip().lower() for role in roles}

	def decorator(fn):
		@wraps(fn)
		def wrapper(*args, **kwargs):
			user = getattr(g, "current_user", None)
			if not user:
				return jsonify({"error": "Authentication required."}), 401
			if user.get("role") not in expected:
				return jsonify({"error": "Insufficient permissions."}), 403
			return fn(*args, **kwargs)

		return wrapper

	return decorator
