from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String

from app.db.database import Base


def _utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, index=True)          # Food | Maintenance | Workers | Manager
    description = Column(String)
    room_number = Column(String, index=True)
    status = Column(String, default="Pending")     # Pending | In Progress | Done
    priority = Column(String, default="Medium")    # Low | Medium | High
    staff_instruction = Column(String, default="")
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow)


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String, unique=True, index=True)
    type = Column(String, default="Single")        # Single | Double | Suite
    status = Column(String, default="Available")   # Available | Occupied | Cleaning Needed | Maintenance
    assigned_guest = Column(String, nullable=True)
