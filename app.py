from pathlib import Path

from flask import Flask, abort, send_from_directory


BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "frontend"

ROUTE_TO_FILE = {
	"": "login.html",
	"login": "login.html",
	"register": "register.html",
	"forgot-password": "forgot_password.html",
	"forgot_password": "forgot_password.html",
	"customer": "index.html",
	"admin": "admin.html",
}


app = Flask(__name__, static_folder=None)


def _normalize_relative_path(path: str) -> str | None:
	relative = str(path or "").strip().lstrip("/")
	if relative.startswith("frontend/"):
		relative = relative[len("frontend/") :]

	if not relative:
		relative = "login.html"

	candidate = (FRONTEND_DIR / relative).resolve()
	try:
		candidate.relative_to(FRONTEND_DIR.resolve())
	except ValueError:
		return None

	if not candidate.is_file():
		return None

	return relative.replace("\\", "/")


def _serve(relative_path: str):
	normalized = _normalize_relative_path(relative_path)
	if not normalized:
		abort(404)
	return send_from_directory(FRONTEND_DIR, normalized)


@app.get("/")
def serve_root():
	return _serve("login.html")


@app.get("/<path:path>")
def serve_path(path: str):
	route_key = str(path or "").strip().lstrip("/")
	if route_key in ROUTE_TO_FILE:
		return _serve(ROUTE_TO_FILE[route_key])
	return _serve(route_key)


if __name__ == "__main__":
	app.run(host="127.0.0.1", port=5000)