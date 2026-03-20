import sys
sys.path.insert(0, r"c:\ai-customer-support-ticket-analysis\backend")
from config import settings
from app import app

print("smtp_host", settings.smtp_host)
print("smtp_port", settings.smtp_port)
print("smtp_tls", settings.smtp_use_tls)
print("smtp_ssl", settings.smtp_use_ssl)
print("smtp_require_auth", settings.smtp_require_auth)
print("has_user", bool(settings.smtp_user))
print("has_password", bool(settings.smtp_password))

client = app.test_client()
resp = client.post("/forgot-password/request", json={"email": "customer@support.local"})
payload = resp.get_json() or {}
print("forgot_password_status", resp.status_code)
print("forgot_password_message", payload.get("message"))
print("fallback_code_present", bool(payload.get("verification_code")))
