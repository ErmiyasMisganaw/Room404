import os
import warnings


def _as_bool(value: str | None, *, default: bool = False) -> bool:
	if value is None:
		return default
	return value.strip().lower() in {"1", "true", "yes", "on"}


APP_ENV = os.getenv("APP_ENV", os.getenv("ENVIRONMENT", "development")).strip().lower()
IS_PRODUCTION = APP_ENV in {"prod", "production"}
DEBUG = _as_bool(os.getenv("DEBUG"), default=not IS_PRODUCTION)


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
if not GEMINI_API_KEY:
	warnings.warn("GEMINI_API_KEY is not set; AI chat routing will be unavailable.")

GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-3.1-flash-lite-preview")

# Database: set DATABASE_URL for Supabase/Postgres in deployment.
# Local fallback keeps current SQLite behavior.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./room404.db").strip() or "sqlite:///./room404.db"
if IS_PRODUCTION and DATABASE_URL.startswith("sqlite"):
	raise RuntimeError("DATABASE_URL must point to a managed Postgres database in production.")

# Comma-separated list, example:
# CORS_ALLOWED_ORIGINS="http://localhost:5173,https://your-frontend.vercel.app"
CORS_ALLOWED_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "*").strip()

if IS_PRODUCTION:
	if not CORS_ALLOWED_ORIGINS:
		raise RuntimeError("CORS_ALLOWED_ORIGINS must be set in production.")
	origins = [origin.strip() for origin in CORS_ALLOWED_ORIGINS.split(",") if origin.strip()]
	if "*" in origins:
		raise RuntimeError("Wildcard CORS ('*') is not allowed in production.")

try:
	STAFF_COOLDOWN_MINUTES = int(os.getenv("STAFF_COOLDOWN_MINUTES", "20"))
except ValueError as exc:
	raise RuntimeError("STAFF_COOLDOWN_MINUTES must be an integer.") from exc

if STAFF_COOLDOWN_MINUTES <= 0:
	raise RuntimeError("STAFF_COOLDOWN_MINUTES must be greater than 0.")

# Lightweight manager endpoint protection for MVP. Override in environment.
MANAGER_DASHBOARD_KEY = os.getenv("MANAGER_DASHBOARD_KEY", "manager-dev-key").strip()
if IS_PRODUCTION and (not MANAGER_DASHBOARD_KEY or MANAGER_DASHBOARD_KEY == "manager-dev-key"):
	raise RuntimeError("Set a strong MANAGER_DASHBOARD_KEY in production.")
