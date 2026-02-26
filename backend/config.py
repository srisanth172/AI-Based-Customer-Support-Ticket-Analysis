import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
	base_dir: Path
	database_dir: Path
	database_url: str
	secret_key: str
	token_expiry_seconds: int


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
	)


settings = _build_settings()
