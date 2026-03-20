from functools import wraps
from random import randint
from uuid import uuid4
import smtplib
from email.message import EmailMessage

from flask import g, jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy.orm import Session
from werkzeug.security import check_password_hash, generate_password_hash

from config import settings
from models import User
from utils import utcnow


ALLOWED_ROLES = {"customer", "admin"}
_serializer = URLSafeTimedSerializer(settings.secret_key)

_puzzle_store: dict[str, dict] = {}
_password_reset_store: dict[str, dict] = {}


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


def create_access_token(user: User) -> str:
	payload = {
		"email": user.email,
		"username": user.username,
		"role": user.role,
	}
	return _generate_token(payload, salt="auth")


def decode_access_token(token: str) -> dict | None:
	return _decode_token(token, salt="auth", max_age=settings.token_expiry_seconds)


def create_login_puzzle() -> dict:
	left = randint(2, 9)
	right = randint(1, 8)
	operation = randint(0, 1)

	if operation == 0:
		question = f"{left} + {right}"
		answer = str(left + right)
	else:
		question = f"{left + right} - {left}"
		answer = str(right)

	puzzle_id = uuid4().hex
	_puzzle_store[puzzle_id] = {
		"answer": answer,
		"expires_at": utcnow().timestamp() + settings.puzzle_expiry_seconds,
	}

	return {
		"puzzle_id": puzzle_id,
		"question": question,
	}


def verify_login_puzzle(puzzle_id: str, puzzle_answer: str) -> bool:
	stored = _puzzle_store.get((puzzle_id or "").strip())
	if not stored:
		return False

	if utcnow().timestamp() > stored["expires_at"]:
		_puzzle_store.pop(puzzle_id, None)
		return False

	answer = str(puzzle_answer or "").strip()
	is_valid = answer == stored["answer"]
	_puzzle_store.pop(puzzle_id, None)
	return is_valid


def register_user(
	db: Session,
	username: str,
	email: str,
	password: str,
	role: str = "customer",
	is_verified: bool = True,
) -> tuple[User | None, str | None]:
	normalized_username = (username or "").strip().lower()
	normalized_email = (email or "").strip().lower()
	selected_role = (role or "customer").strip().lower()

	if selected_role not in ALLOWED_ROLES:
		return None, "Invalid role. Allowed roles: customer, admin."

	if not normalized_username or not normalized_email or not password:
		return None, "username, email, and password are required."

	if db.query(User).filter(User.username == normalized_username).first():
		return None, "Username already exists."

	if db.query(User).filter(User.email == normalized_email).first():
		return None, "Email is already registered."

	now = utcnow()
	user = User(
		username=normalized_username,
		email=normalized_email,
		password_hash=hash_password(password),
		role=selected_role,
		is_verified=is_verified,
		created_at=now,
		updated_at=now,
	)
	db.add(user)
	db.commit()
	db.refresh(user)
	return user, None


def login_user(db: Session, username: str, password: str) -> tuple[dict | None, str | None]:
	normalized_username = (username or "").strip().lower()
	user = db.query(User).filter(User.username == normalized_username).first()
	if not user and "@" in normalized_username:
		user = db.query(User).filter(User.email == normalized_username).first()

	if not user or not verify_password(password, user.password_hash):
		return None, "Invalid credentials."
	if not user.is_verified:
		return None, "User is not verified."

	return {
		"access_token": create_access_token(user),
		"role": user.role,
		"username": user.username,
		"email": user.email,
	}, None


def request_password_reset(db: Session, email: str) -> tuple[bool, str, str | None]:
	normalized_email = (email or "").strip().lower()
	user = db.query(User).filter(User.email == normalized_email).first()
	if not user:
		return False, "No account found for this email.", None

	code = f"{randint(100000, 999999)}"
	_password_reset_store[normalized_email] = {
		"code": code,
		"expires_at": utcnow().timestamp() + settings.reset_code_expiry_seconds,
	}

	sent = _send_reset_email(normalized_email, code)
	if sent:
		return True, "Verification code sent to your email.", None

	# Development fallback when SMTP is not configured.
	print(f"[RESET CODE] email={normalized_email} code={code}")
	return True, "Verification code generated. Configure SMTP to send emails automatically.", code


def verify_password_reset_code(email: str, code: str) -> tuple[bool, str]:
	normalized_email = (email or "").strip().lower()
	entry = _password_reset_store.get(normalized_email)
	if not entry:
		return False, "No reset request found for this email."

	if utcnow().timestamp() > entry["expires_at"]:
		_password_reset_store.pop(normalized_email, None)
		return False, "Verification code expired."

	if str(code or "").strip() != entry["code"]:
		return False, "Invalid verification code."

	return True, "Verification successful."


def reset_password(db: Session, email: str, code: str, new_password: str) -> tuple[bool, str]:
	is_valid, message = verify_password_reset_code(email, code)
	if not is_valid:
		return False, message

	normalized_email = (email or "").strip().lower()
	user = db.query(User).filter(User.email == normalized_email).first()
	if not user:
		return False, "User not found."

	user.password_hash = hash_password(new_password)
	user.updated_at = utcnow()
	db.commit()

	_password_reset_store.pop(normalized_email, None)
	return True, "Password reset successful."


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

	g.current_user = {
		"email": user.email,
		"username": user.username,
		"role": user.role,
	}
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


def seed_default_users(db: Session) -> None:
	default_users = [
		{
			"username": "customer",
			"email": "customer@support.local",
			"password": "customer123",
			"role": "customer",
		},
		{
			"username": "admin",
			"email": "admin@support.local",
			"password": "admin123",
			"role": "admin",
		},
	]

	for entry in default_users:
		if db.query(User).filter(User.username == entry["username"]).first():
			continue

		register_user(
			db,
			username=entry["username"],
			email=entry["email"],
			password=entry["password"],
			role=entry["role"],
			is_verified=True,
		)


def _send_reset_email(recipient: str, code: str) -> bool:
	if not settings.smtp_host:
		return False

	require_auth = settings.smtp_require_auth
	has_auth = bool(settings.smtp_user and settings.smtp_password)
	if require_auth and not has_auth:
		return False

	sender_email = settings.smtp_sender or settings.smtp_user
	if not sender_email:
		return False

	message = EmailMessage()
	message["Subject"] = "Support Portal Password Reset Code"
	message["From"] = f"{settings.smtp_sender_name} <{sender_email}>"
	message["To"] = recipient
	message.set_content(
		"Use the verification code below to reset your password:\n\n"
		f"{code}\n\n"
		"If you did not request this, you can ignore this email."
	)

	try:
		smtp_client = smtplib.SMTP_SSL if settings.smtp_use_ssl else smtplib.SMTP
		with smtp_client(settings.smtp_host, settings.smtp_port, timeout=settings.smtp_timeout_seconds) as server:
			if settings.smtp_use_tls and not settings.smtp_use_ssl:
				server.starttls()
			if has_auth:
				server.login(settings.smtp_user, settings.smtp_password)
			server.send_message(message)
		return True
	except Exception as error:
		print(f"[EMAIL ERROR] Could not send reset email: {error}")
		return False
