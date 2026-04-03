from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User message coming from the UI")
    room_number: str = Field(default="Unknown", description="Guest's room number")


class TaskOut(BaseModel):
    id: int
    category: str
    description: str
    room_number: str
    status: str
    priority: str
    staff_instruction: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TaskStatusUpdate(BaseModel):
    status: str


class RoomOut(BaseModel):
    id: int
    room_number: str
    type: str
    status: str
    assigned_guest: Optional[str]

    model_config = {"from_attributes": True}


class RoutedInstruction(BaseModel):
    instruction_id: str
    category: str
    response_to_guest: str
    staff_instruction: str
    priority: str = "Medium"
    room: str = "Unknown"
    title: Optional[str] = None
    description: Optional[str] = None
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TaskFeedbackRecord(BaseModel):
    instruction_id: str
    queue_name: str
    state: str
    note: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class FoodAvailabilityItem(BaseModel):
    item_name: str
    available_quantity: int = Field(default=0, ge=0)
    is_available: bool = True
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    note: Optional[str] = None
