import re

from flask import Flask, g, jsonify, render_template, request

from ai_module import analyze_sentiment, classify_ticket_confirmation, generate_chat_intelligence, train_category_model
from auth import (
	authenticate_request,
	create_login_puzzle,
	login_user,
	register_user,
	request_password_reset,
	reset_password,
	role_required,
	seed_default_users,
	verify_login_puzzle,
	verify_password_reset_code,
)
from models import SessionLocal, init_db
from ticket_handler import (
	create_ticket,
	dashboard_metrics,
	get_ticket_by_uid,
	list_tickets,
	recurring_issue_report,
	update_ticket_status,
)


app = Flask(
	__name__,
	template_folder="../frontend",
	static_folder="../frontend",
	static_url_path="",
)

TICKET_ID_PATTERN = re.compile(r"\bTKT-[A-Z0-9]{6}\b", re.IGNORECASE)

init_db()
train_category_model()

_seed_session = SessionLocal()
try:
	seed_default_users(_seed_session)
finally:
	_seed_session.close()


@app.before_request
def open_db_session():
	g.db = SessionLocal()
	authenticate_request(g.db)
	


@app.teardown_request
def close_db_session(_error):
	db = getattr(g, "db", None)
	if db:
		db.close()


@app.after_request
def add_cors_headers(response):
	response.headers["Access-Control-Allow-Origin"] = "*"
	response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
	response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, OPTIONS"
	return response


@app.get("/")
@app.get("/login")
def serve_login():
	return render_template("login.html")


@app.get("/register")
def serve_register_page():
	return render_template("register.html")


@app.get("/forgot-password")
@app.get("/forgot_password")
def serve_forgot_password_page():
	return render_template("forgot_password.html")


@app.get("/customer")
def serve_customer():
	return render_template("index.html")


@app.get("/admin")
def serve_admin():
	return render_template("admin.html")


@app.post("/auth/puzzle")
def auth_puzzle():
	return jsonify(create_login_puzzle()), 200


@app.post("/auth/register")
@app.post("/register")
def register():
	payload = request.get_json(silent=True) or {}
	email = str(payload.get("email", "")).strip().lower()
	username = str(payload.get("username", "")).strip().lower() or email.split("@", 1)[0]
	password = str(payload.get("password", "")).strip()
	role = str(payload.get("role", "customer")).strip().lower()

	if not email or not password:
		return jsonify({"error": "email and password are required."}), 400
	if not username:
		return jsonify({"error": "username is required."}), 400

	user, error = register_user(g.db, username=username, email=email, password=password, role=role, is_verified=True)
	if error:
		return jsonify({"error": error}), 400
	if user is None:
		return jsonify({"error": "Unable to register user."}), 500

	return (
		jsonify(
			{
				"message": "User registered successfully.",
				"username": user.username,
				"email": user.email,
				"role": user.role,
			}
		),
		201,
	)


@app.post("/auth/login")
@app.post("/login")
def login():
	payload = request.get_json(silent=True) or {}
	email = str(payload.get("email", "")).strip().lower()
	username = str(payload.get("username", "")).strip().lower()
	identifier = email or username
	password = str(payload.get("password", "")).strip()
	puzzle_id = str(payload.get("puzzle_id", "")).strip()
	puzzle_answer = str(payload.get("puzzle_answer", "")).strip()

	if not identifier or not password:
		return jsonify({"error": "email and password are required."}), 400

	if not verify_login_puzzle(puzzle_id, puzzle_answer):
		return jsonify({"error": "Bot verification failed."}), 400

	auth_result, error = login_user(g.db, username=identifier, password=password)
	if error:
		return jsonify({"error": error}), 401

	return jsonify(auth_result), 200


@app.post("/auth/request-password-reset")
@app.post("/forgot-password/request")
def auth_request_password_reset():
	payload = request.get_json(silent=True) or {}
	email = str(payload.get("email", "")).strip().lower()
	if not email:
		return jsonify({"error": "email is required."}), 400

	ok, message, debug_code = request_password_reset(g.db, email)
	response = {"message": message}
	if debug_code:
		response["verification_code"] = debug_code
	return jsonify(response), 200 if ok else 404


@app.post("/auth/verify-reset-code")
@app.post("/forgot-password/verify")
def auth_verify_reset_code():
	payload = request.get_json(silent=True) or {}
	email = str(payload.get("email", "")).strip().lower()
	code = str(payload.get("code", "")).strip()
	ok, message = verify_password_reset_code(email, code)
	return jsonify({"message": message}), 200 if ok else 400


@app.post("/auth/reset-password")
@app.post("/forgot-password/reset")
def auth_reset_password():
	payload = request.get_json(silent=True) or {}
	email = str(payload.get("email", "")).strip().lower()
	code = str(payload.get("code", "")).strip()
	new_password = str(payload.get("new_password", "")).strip()

	if not email or not code or not new_password:
		return jsonify({"error": "email, code, and new_password are required."}), 400

	ok, message = reset_password(g.db, email, code, new_password)
	return jsonify({"message": message}), 200 if ok else 400


@app.get("/auth/me")
def auth_me():
	user = getattr(g, "current_user", None)
	if not user:
		return jsonify({"error": "Not authenticated."}), 401
	return jsonify(user), 200


@app.post("/submit_ticket")
@app.post("/create_ticket")
def submit_ticket():
	payload = request.get_json(silent=True) or {}
	title = str(payload.get("title", "")).strip()
	description = str(payload.get("description", "")).strip()
	category = str(payload.get("category", "")).strip()
	customer_email = str(payload.get("customer_email", "")).strip().lower() or None
	force_escalate = bool(payload.get("force_escalate", False))

	if not title or not description or not category:
		return jsonify({"error": "Missing required fields: title, description, and category are required."}), 400

	ticket, metadata = create_ticket(
		g.db,
		title=title,
		description=description,
		category=category,
		customer_email=customer_email,
		force_escalate=force_escalate,
	)

	return (
		jsonify(
			{
				"ticket_id": metadata["ticket_uid"],
				"sentiment": ticket.sentiment,
				"priority_score": metadata["priority_score"],
				"priority_level": metadata["priority_level"],
				"status": ticket.status,
				"message": f"Ticket submitted successfully. Ticket ID: {metadata['ticket_uid']}",
				"duplicate_detected": metadata["is_duplicate"],
				"duplicate_of_id": metadata["duplicate_of_id"],
				"escalation_reason": metadata["escalation_reason"],
			}
		),
		201,
	)


@app.get("/tickets/status/<string:ticket_uid>")
@app.get("/check_ticket_status/<string:ticket_uid>")
def get_ticket_status(ticket_uid: str):
	ticket = get_ticket_by_uid(g.db, ticket_uid)
	if not ticket:
		return jsonify({"error": "Ticket not found."}), 404

	return jsonify(ticket), 200


@app.get("/check_ticket_status")
def get_ticket_status_query():
	ticket_uid = str(request.args.get("ticket_id", "")).strip()
	if not ticket_uid:
		return jsonify({"error": "ticket_id is required."}), 400
	return get_ticket_status(ticket_uid)


@app.get("/tickets")
@app.get("/get_tickets")
@role_required("admin")
def get_tickets():
	return jsonify(list_tickets(g.db)), 200


def _change_status_by_reference(ticket_uid: str, status: str):
	ticket, error = update_ticket_status(g.db, ticket_uid, status)
	if error:
		status_code = 404 if "not found" in error.lower() else 400
		return jsonify({"error": error}), status_code
	return jsonify(ticket), 200


@app.put("/tickets/<string:ticket_uid>/status")
@app.put("/update_ticket_status/<string:ticket_uid>")
@role_required("admin")
def change_ticket_status(ticket_uid: str):
	payload = request.get_json(silent=True) or {}
	return _change_status_by_reference(ticket_uid, str(payload.get("status", "")))


@app.put("/update_ticket_status")
@role_required("admin")
def change_ticket_status_body():
	payload = request.get_json(silent=True) or {}
	ticket_uid = str(payload.get("ticket_id", "")).strip()
	status = str(payload.get("status", ""))
	if not ticket_uid:
		return jsonify({"error": "ticket_id is required."}), 400
	return _change_status_by_reference(ticket_uid, status)


@app.get("/analytics/recurring")
@role_required("admin")
def recurring_analytics():
	return jsonify(recurring_issue_report(g.db)), 200


@app.get("/analytics/overview")
@role_required("admin")
def analytics_overview():
	return jsonify(dashboard_metrics(g.db)), 200


@app.post("/chatbot/ask")
@app.post("/chatbot")
def chatbot_ask():
	payload = request.get_json(silent=True) or {}
	message = str(payload.get("message", "")).strip()
	customer_email = str(payload.get("customer_email", "")).strip().lower() or None
	conversation = payload.get("conversation", [])
	awaiting_confirmation = bool(payload.get("awaiting_confirmation", False))
	pending_ticket_context = payload.get("pending_ticket_context", {}) or {}

	if not message:
		return jsonify({"error": "message is required."}), 400

	lower_message = message.lower()
	ticket_match = TICKET_ID_PATTERN.search(message)
	ticket_uid = ticket_match.group(0).upper() if ticket_match else None
	status_keywords = (
		"status",
		"track",
		"tracking",
		"progress",
		"update",
		"state",
	)
	status_intent = any(keyword in lower_message for keyword in status_keywords)
	direct_ticket_lookup = bool(ticket_uid) and (
		status_intent
		or "ticket" in lower_message
		or lower_message.strip() == ticket_uid.lower()
	)

	if status_intent or direct_ticket_lookup:
		if status_intent and not ticket_uid:
			return jsonify(
				{
					"response": "Please share your ticket ID (example: TKT-ABC123), and I will check the current status.",
					"confidence": 0.95,
					"sentiment": analyze_sentiment(message),
					"ask_ticket_confirmation": False,
					"escalate_to_human": False,
					"escalation_ticket_id": None,
					"pending_ticket_context": None,
				}
			), 200

		if not ticket_uid:
			return jsonify(
				{
					"response": "Please share your ticket ID in the format TKT-XXXXXX so I can look it up.",
					"confidence": 0.9,
					"sentiment": analyze_sentiment(message),
					"ask_ticket_confirmation": False,
					"escalate_to_human": False,
					"escalation_ticket_id": None,
					"pending_ticket_context": None,
				}
			), 200

		ticket_data = get_ticket_by_uid(g.db, ticket_uid)
		if not ticket_data:
			return jsonify(
				{
					"response": f"I could not find ticket {ticket_uid}. Please verify the ID and try again.",
					"confidence": 0.9,
					"sentiment": analyze_sentiment(message),
					"ask_ticket_confirmation": False,
					"escalate_to_human": False,
					"escalation_ticket_id": None,
					"pending_ticket_context": None,
				}
			), 200

		status_text = str(ticket_data.get("status", "open")).replace("-", " ")
		return jsonify(
			{
				"response": f"Ticket {ticket_uid} is currently {status_text}.",
				"confidence": 0.99,
				"sentiment": analyze_sentiment(message),
				"ask_ticket_confirmation": False,
				"escalate_to_human": False,
				"escalation_ticket_id": None,
				"pending_ticket_context": None,
			}
		), 200

	if awaiting_confirmation:
		decision = classify_ticket_confirmation(message)
		if decision == "yes":
			description = str(pending_ticket_context.get("description", "")).strip() or "Customer requested support via chatbot."
			title = str(pending_ticket_context.get("title", "")).strip() or f"Chat support request: {description[:32]}"
			category = str(pending_ticket_context.get("category", "")).strip() or "General"

			ticket, metadata = create_ticket(
				g.db,
				title=title,
				description=description,
				category=category,
				customer_email=customer_email,
				force_escalate=True,
			)

			return (
				jsonify(
					{
						"response": f"Done. I created a support ticket for you. Ticket ID: {metadata['ticket_uid']}",
						"confidence": 1.0,
						"sentiment": analyze_sentiment(description),
						"ask_ticket_confirmation": False,
						"escalate_to_human": True,
						"escalation_ticket_id": metadata["ticket_uid"],
					}
				),
				200,
			)

		if decision == "no":
			return jsonify(
				{
					"response": "No problem. I will continue assisting you here. Let me know what you need next.",
					"confidence": 0.9,
					"sentiment": analyze_sentiment(message),
					"ask_ticket_confirmation": False,
					"escalate_to_human": False,
					"escalation_ticket_id": None,
				}
			), 200

		return jsonify(
			{
				"response": "I could not confirm that. Please reply with yes if you want me to create a ticket.",
				"confidence": 0.5,
				"sentiment": analyze_sentiment(message),
				"ask_ticket_confirmation": True,
				"escalate_to_human": False,
				"escalation_ticket_id": None,
			}
		), 200

	chat_data = generate_chat_intelligence(user_message=message, conversation=conversation)
	sentiment = analyze_sentiment(message)
	complaint_detected = bool(chat_data.get("complaint_detected", False))
	wants_human_agent = bool(chat_data.get("wants_human_agent", False))
	escalate = complaint_detected or wants_human_agent or sentiment == "negative"

	response_text = str(chat_data.get("reply", "")).strip() or "Could you tell me more so I can help?"
	if escalate:
		response_text = f"{response_text}\n\nWould you like me to create a support ticket for this issue?"

	pending_ticket_context = {
		"title": str(chat_data.get("suggested_title", f"Chat issue: {message[:40]}"))[:120],
		"description": message,
		"category": str(chat_data.get("suggested_category", "General")),
	}

	return (
		jsonify(
			{
				"response": response_text,
				"confidence": round(float(chat_data.get("confidence", 0.5)), 3),
				"sentiment": sentiment,
				"ask_ticket_confirmation": escalate,
				"escalate_to_human": escalate,
				"escalation_ticket_id": None,
				"pending_ticket_context": pending_ticket_context,
			}
		),
		200,
	)


if __name__ == "__main__":
	app.run(debug=True)
