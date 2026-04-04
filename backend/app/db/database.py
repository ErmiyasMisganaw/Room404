from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import DATABASE_URL

SQLALCHEMY_DATABASE_URL = DATABASE_URL

url = make_url(SQLALCHEMY_DATABASE_URL)
is_sqlite = url.get_backend_name() == "sqlite"

connect_args = {"check_same_thread": False} if is_sqlite else {}

if not is_sqlite:
    query_dict = dict(url.query)
    if "sslmode" not in query_dict:
        connect_args["sslmode"] = "require"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=not is_sqlite,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_additive_schema() -> None:
    """Apply additive column migrations needed for backward-compatible upgrades."""
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    with engine.begin() as conn:
        if "tasks" in existing_tables:
            task_cols = {col["name"] for col in inspector.get_columns("tasks")}
            if "assigned_staff_id" not in task_cols:
                conn.execute(text("ALTER TABLE tasks ADD COLUMN assigned_staff_id INTEGER"))
            if "assigned_at" not in task_cols:
                conn.execute(text("ALTER TABLE tasks ADD COLUMN assigned_at TIMESTAMP"))
            if "completed_at" not in task_cols:
                conn.execute(text("ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP"))

        if "food_availability" in existing_tables:
            food_cols = {col["name"] for col in inspector.get_columns("food_availability")}
            if "version" not in food_cols:
                conn.execute(text("ALTER TABLE food_availability ADD COLUMN version INTEGER DEFAULT 1"))
            if "updated_by" not in food_cols:
                conn.execute(text("ALTER TABLE food_availability ADD COLUMN updated_by VARCHAR DEFAULT 'cafeteria'"))

        if "task_feedback" in existing_tables:
            feedback_cols = {col["name"] for col in inspector.get_columns("task_feedback")}
            if "accepted_by" not in feedback_cols:
                conn.execute(text("ALTER TABLE task_feedback ADD COLUMN accepted_by VARCHAR"))
            if "accepted_at" not in feedback_cols:
                conn.execute(text("ALTER TABLE task_feedback ADD COLUMN accepted_at TIMESTAMP"))
