import os


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-3.1-flash-lite-preview")

# Database: set DATABASE_URL for Supabase/Postgres in deployment.
# Local fallback keeps current SQLite behavior.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./room404.db")

# Comma-separated list, example:
# CORS_ALLOWED_ORIGINS="http://localhost:5173,https://your-frontend.vercel.app"
CORS_ALLOWED_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "*")

STAFF_COOLDOWN_MINUTES = int(os.getenv("STAFF_COOLDOWN_MINUTES", "20"))

# Lightweight manager endpoint protection for MVP. Override in environment.
MANAGER_DASHBOARD_KEY = os.getenv("MANAGER_DASHBOARD_KEY", "manager-dev-key")
