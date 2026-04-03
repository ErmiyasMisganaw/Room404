from sqlalchemy import create_engine
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
