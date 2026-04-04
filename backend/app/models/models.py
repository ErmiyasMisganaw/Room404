from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String

from app.db.database import Base


def _utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, index=True)          # Food | Maintenance | Cleaners | Manager
    description = Column(String)
    room_number = Column(String, index=True)
    status = Column(String, default="Pending")     # Pending | In Progress | Done
    priority = Column(String, default="Medium")    # Low | Medium | High
    staff_instruction = Column(String, default="")
    assigned_staff_id = Column(Integer, ForeignKey("staff_members.id"), nullable=True, index=True)
    assigned_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow)


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String, unique=True, index=True)
    type = Column(String, default="Single")        # Single | Double | Suite
    status = Column(String, default="Available")   # Available | Occupied | Cleaning Needed | Maintenance
    assigned_guest = Column(String, nullable=True)


class RoutedInstruction(Base):
    __tablename__ = "routed_instructions"

    instruction_id = Column(String, primary_key=True, index=True)
    queue_name = Column(String, index=True)  # food | maintenance | cleaners | manager | ignore
    category = Column(String, index=True)
    title = Column(String, default="")
    description = Column(String, default="")
    room = Column(String, default="Unknown")
    priority = Column(String, default="Medium")
    response_to_guest = Column(String, default="")
    staff_instruction = Column(String, default="")
    status = Column(String, default="pending")
    linked_task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow)


class TaskFeedback(Base):
    __tablename__ = "task_feedback"

    instruction_id = Column(String, primary_key=True, index=True)
    queue_name = Column(String, index=True)
    state = Column(String, index=True)
    note = Column(String, default="")
    accepted_by = Column(String, nullable=True, index=True)
    accepted_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=_utcnow)


class FoodAvailability(Base):
    __tablename__ = "food_availability"

    item_name = Column(String, primary_key=True, index=True)
    available_quantity = Column(Integer, default=0)
    price = Column(Float, default=0.0)
    is_available = Column(Boolean, default=True)
    note = Column(String, default="")
    version = Column(Integer, default=1)
    updated_by = Column(String, default="cafeteria")
    updated_at = Column(DateTime, default=_utcnow)


class StaffMember(Base):
    __tablename__ = "staff_members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    pool = Column(String, index=True)  # cleaners | maintenance
    is_available = Column(Boolean, default=True)
    cooldown_until = Column(DateTime, nullable=True)
    active_task_count = Column(Integer, default=0)
    total_assigned_count = Column(Integer, default=0)
    completed_task_count = Column(Integer, default=0)
    last_assigned_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow)


class ChatMemory(Base):
    __tablename__ = "chat_memory"

    id = Column(Integer, primary_key=True, index=True)
    user_key = Column(String, index=True)
    role = Column(String, index=True)  # user | assistant
    line = Column(String, default="")
    created_at = Column(DateTime, default=_utcnow)
