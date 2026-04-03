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
