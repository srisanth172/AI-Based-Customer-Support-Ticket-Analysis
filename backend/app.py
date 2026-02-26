from flask import Flask, g, jsonify, render_template, request

from ai_module import analyze_sentiment, generate_chat_response, train_category_model
from auth import authenticate_request, confirm_user_email, login_user, register_user
from models import SessionLocal, init_db
from ticket_handler import create_ticket, list_tickets, recurring_issue_report, update_ticket_status


app = Flask(
	__name__,
	template_folder="../frontend",
	static_folder="../frontend",
	static_url_path="",
)

init_db()
train_category_model()


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
def serve_index():
	return render_template("index.html")


@app.get("/admin")
def serve_admin():
	return render_template("admin.html")


@app.post("/auth/register")
def register():
	payload = request.get_json(silent=True) or {}
	email = str(payload.get("email", "")).strip().lower()
	password = str(payload.get("password", "")).strip()
	role = str(payload.get("role", "customer")).strip().lower()

	if not email or not password:
		return jsonify({"error": "Email and password are required."}), 400

	user, verification_token, error = register_user(g.db, email, password, role)
	if error:
		return jsonify({"error": error}), 400
	if user is None or verification_token is None:
		return jsonify({"error": "Unable to register user."}), 500

	return (
		jsonify(
			{
				"message": "User registered. Verify email to activate account.",
				"email": user.email,
				"role": user.role,
				"verification_token": verification_token,
			}
		),
		201,
	)


@app.post("/auth/verify-email")
def verify_email():
	payload = request.get_json(silent=True) or {}
	token = str(payload.get("token", "")).strip()
	if not token:
		return jsonify({"error": "Verification token is required."}), 400

	ok, message = confirm_user_email(g.db, token)
	return jsonify({"message": message}) if ok else (jsonify({"error": message}), 400)


@app.post("/auth/login")
def login():
	payload = request.get_json(silent=True) or {}
	token, error = login_user(g.db, payload.get("email", ""), payload.get("password", ""))
	if error:
		return jsonify({"error": error}), 401

	return jsonify({"access_token": token, "token_type": "Bearer"}), 200


@app.post("/submit_ticket")
def submit_ticket():
	payload = request.get_json(silent=True) or {}
	title = str(payload.get("title", "")).strip()
	description = str(payload.get("description", "")).strip()
	category = str(payload.get("category", "")).strip()
	customer_email = str(payload.get("customer_email", "")).strip().lower() or None

	if not title or not description or not category:
		return jsonify({"error": "Missing required fields: title, description, and category are required."}), 400

	ticket, metadata = create_ticket(
		g.db,
		title=title,
		description=description,
		category=category,
		customer_email=customer_email,
	)

	return (
		jsonify(
			{
				"ticket_id": ticket.id,
				"sentiment": ticket.sentiment,
				"message": "Ticket submitted successfully.",
				"duplicate_detected": metadata["is_duplicate"],
				"duplicate_of_id": metadata["duplicate_of_id"],
			}
		),
		201,
	)


@app.get("/tickets")
def get_tickets():
	return jsonify(list_tickets(g.db)), 200


@app.put("/tickets/<int:ticket_id>/status")
def change_ticket_status(ticket_id: int):
	payload = request.get_json(silent=True) or {}
	ticket, error = update_ticket_status(g.db, ticket_id, str(payload.get("status", "")))
	if error:
		status_code = 404 if "not found" in error.lower() else 400
		return jsonify({"error": error}), status_code
	return jsonify(ticket), 200


@app.get("/analytics/recurring")
def recurring_analytics():
	return jsonify(recurring_issue_report(g.db)), 200


@app.post("/chatbot/ask")
def chatbot_ask():
	payload = request.get_json(silent=True) or {}
	message = str(payload.get("message", "")).strip()
	customer_email = str(payload.get("customer_email", "")).strip().lower() or None

	if not message:
		return jsonify({"error": "message is required."}), 400

	response_text, confidence = generate_chat_response(message)
	sentiment = analyze_sentiment(message)
	escalate = confidence < 0.55 or sentiment == "Negative"

	escalation_ticket_id = None
	if escalate:
		ticket, _ = create_ticket(
			g.db,
			title=f"Chat escalation: {message[:40]}",
			description=message,
			category="General",
			customer_email=customer_email,
		)
		escalation_ticket_id = ticket.id

	return (
		jsonify(
			{
				"response": response_text,
				"confidence": round(confidence, 3),
				"sentiment": sentiment,
				"escalate_to_human": escalate,
				"escalation_ticket_id": escalation_ticket_id,
			}
		),
		200,
	)


if __name__ == "__main__":
	app.run(debug=True)
