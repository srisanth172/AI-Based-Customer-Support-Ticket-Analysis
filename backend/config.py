import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_ENV_FILE)


@dataclass(frozen=True)
class Settings:
	base_dir: Path
	database_dir: Path
	database_url: str
	secret_key: str
	token_expiry_seconds: int
	openrouter_api_key: str
	openrouter_model: str
	openrouter_app_name: str
	openrouter_site_url: str
	puzzle_expiry_seconds: int
	reset_code_expiry_seconds: int
	smtp_host: str
	smtp_port: int
	smtp_user: str
	smtp_password: str
	smtp_sender: str
	smtp_sender_name: str
	smtp_use_tls: bool
	smtp_use_ssl: bool
	smtp_timeout_seconds: int
	smtp_require_auth: bool


def _build_settings() -> Settings:
	base_dir = Path(__file__).resolve().parent.parent
	database_dir = base_dir / "database"
	database_dir.mkdir(parents=True, exist_ok=True)

	database_path = database_dir / "support_system.db"
	database_url = os.getenv("DATABASE_URL", f"sqlite:///{database_path.as_posix()}")

	return Settings(
		base_dir=base_dir,
		database_dir=database_dir,
		database_url=database_url,
		secret_key=os.getenv("APP_SECRET_KEY", "change-this-in-production"),
		token_expiry_seconds=int(os.getenv("TOKEN_EXPIRY_SECONDS", "86400")),
		openrouter_api_key=os.getenv("OPENROUTER_API_KEY", ""),
		openrouter_model=os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
		openrouter_app_name=os.getenv("OPENROUTER_APP_NAME", "AI Customer Support"),
		openrouter_site_url=os.getenv("OPENROUTER_SITE_URL", "http://localhost:5000"),
		puzzle_expiry_seconds=int(os.getenv("PUZZLE_EXPIRY_SECONDS", "300")),
		reset_code_expiry_seconds=int(os.getenv("RESET_CODE_EXPIRY_SECONDS", "600")),
		smtp_host=os.getenv("SMTP_HOST", ""),
		smtp_port=int(os.getenv("SMTP_PORT", "587")),
		smtp_user=os.getenv("SMTP_USER", ""),
		smtp_password=os.getenv("SMTP_PASSWORD", ""),
		smtp_sender=os.getenv("SMTP_SENDER", ""),
		smtp_sender_name=os.getenv("SMTP_SENDER_NAME", "AI Customer Support"),
		smtp_use_tls=os.getenv("SMTP_USE_TLS", "true").strip().lower() in {"1", "true", "yes"},
		smtp_use_ssl=os.getenv("SMTP_USE_SSL", "false").strip().lower() in {"1", "true", "yes"},
		smtp_timeout_seconds=int(os.getenv("SMTP_TIMEOUT_SECONDS", "20")),
		smtp_require_auth=os.getenv("SMTP_REQUIRE_AUTH", "true").strip().lower() in {"1", "true", "yes"},
	)


settings = _build_settings()
