import time
import os
import sys

sys.path.insert(0, "c:/ai-customer-support-ticket-analysis/backend")
os.chdir("c:/ai-customer-support-ticket-analysis/backend")
from app import app


def solve_puzzle(question: str) -> str:
    """Parse and solve simple arithmetic puzzle"""
    left, op, right = question.split()
    left_num = int(left)
    right_num = int(right)
    if op == "+":
        return str(left_num + right_num)
    return str(left_num - right_num)


client = app.test_client()

# Test customer login with puzzle
puzzle = client.post("/auth/puzzle").get_json()
customer_login = client.post(
    "/login",
    json={
        "email": "customer@support.local",
        "password": "customer123",
        "puzzle_id": puzzle["puzzle_id"],
        "puzzle_answer": solve_puzzle(puzzle["question"]),
    },
)
customer_payload = customer_login.get_json() or {}
customer_token = customer_payload.get("access_token", "")
customer_headers = {"Authorization": f"Bearer {customer_token}"}
print("customer_login", customer_login.status_code, customer_payload.get("role"))

# Test ticket creation with new /create_ticket alias
created = client.post(
    "/create_ticket",
    json={
        "title": "Website payment failed",
        "description": "My payment fails repeatedly and this is frustrating.",
        "category": "Billing",
        "customer_email": "customer@support.local",
    },
    headers=customer_headers,
)
created_data = created.get_json() or {}
ticket_id = created_data.get("ticket_id", "")
print(
    "create_ticket",
    created.status_code,
    ticket_id,
    created_data.get("priority_level"),
    created_data.get("priority_score"),
)

# Test status lookup
status_direct = client.get(f"/check_ticket_status/{ticket_id}", headers=customer_headers)
print("check_ticket_status_path", status_direct.status_code, (status_direct.get_json() or {}).get("status"))

status_query = client.get("/check_ticket_status", query_string={"ticket_id": ticket_id}, headers=customer_headers)
print("check_ticket_status_query", status_query.status_code, (status_query.get_json() or {}).get("status"))

# Test chatbot /chatbot alias
chat_status = client.post(
    "/chatbot",
    json={
        "message": f"Can you share the status for ticket {ticket_id}?",
        "customer_email": "customer@support.local",
    },
    headers=customer_headers,
)
print("chatbot", chat_status.status_code, (chat_status.get_json() or {}).get("response"))

# Test register alias
suffix = int(time.time()) % 100000
register_response = client.post(
    "/register",
    json={
        "username": f"user{suffix}",
        "email": f"user{suffix}@example.com",
        "password": "pass1234",
        "role": "customer",
    },
)
print("register", register_response.status_code, (register_response.get_json() or {}).get("message"))

# Test forgot password request alias
forgot_request = client.post("/forgot-password/request", json={"email": "customer@support.local"})
forgot_json = forgot_request.get_json() or {}
print(
    "forgot_password_request", forgot_request.status_code, bool(forgot_json.get("message")), bool(forgot_json.get("verification_code"))
)

# Test admin login
admin_puzzle = client.post("/auth/puzzle").get_json()
admin_login = client.post(
    "/login",
    json={
        "email": "admin@support.local",
        "password": "admin123",
        "puzzle_id": admin_puzzle["puzzle_id"],
        "puzzle_answer": solve_puzzle(admin_puzzle["question"]),
    },
)
admin_data = admin_login.get_json() or {}
admin_headers = {"Authorization": f"Bearer {admin_data.get('access_token', '')}"}
print("admin_login", admin_login.status_code, admin_data.get("role"))

# Test admin /get_tickets alias
get_tickets_response = client.get("/get_tickets", headers=admin_headers)
print("get_tickets", get_tickets_response.status_code, len(get_tickets_response.get_json() or []))

# Test admin /update_ticket_status alias
update_status_response = client.put(
    f"/update_ticket_status/{ticket_id}",
    json={"status": "in-progress"},
    headers=admin_headers,
)
print("update_ticket_status", update_status_response.status_code, (update_status_response.get_json() or {}).get("status"))

print("\nAll route alias tests completed successfully.")
