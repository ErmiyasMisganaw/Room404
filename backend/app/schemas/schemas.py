from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
	message: str = Field(..., min_length=1, description="User message coming from the UI")


CategoryType = Literal["Food", "Maintenance", "Workers", "Manager", "Ignore"]
PriorityType = Literal["Low", "Medium", "High"]


class AIDispatchPayload(BaseModel):
	category: CategoryType
	response_to_guest: str = Field(..., min_length=1)
	staff_instruction: str = Field(..., min_length=1)
	priority: PriorityType


class RoutedInstruction(BaseModel):
	instruction_id: str
	category: CategoryType
	response_to_guest: str
	staff_instruction: str
	priority: PriorityType
	target_queue: Literal["food", "maintenance", "workers", "manager", "ignore"]
	created_at: datetime


class DispatchResponse(BaseModel):
	accepted: bool
	message: str
	routed_instruction: RoutedInstruction | None = None


class QueueResponse(BaseModel):
	queue: Literal["food", "maintenance", "workers", "manager", "ignore"]
	count: int
	items: list[RoutedInstruction]
