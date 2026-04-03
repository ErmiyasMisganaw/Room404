from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
	message: str = Field(..., min_length=1, description="User message coming from the UI")


CategoryType = Literal["Food", "Maintenance", "Workers", "Manager", "Ignore"]
PriorityType = Literal["Low", "Medium", "High"]
QueueNameType = Literal["food", "maintenance", "workers", "manager", "ignore"]
TaskStateType = Literal["Pending", "In Progress", "Completed", "Rejected", "Blocked"]


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
	target_queue: QueueNameType
	created_at: datetime


class DispatchResponse(BaseModel):
	accepted: bool
	message: str
	routed_instruction: RoutedInstruction | None = None


class QueueResponse(BaseModel):
	queue: QueueNameType
	count: int
	items: list[RoutedInstruction]


class TaskFeedbackPayload(BaseModel):
	instruction_id: str = Field(..., min_length=1)
	queue: QueueNameType
	state: TaskStateType
	is_complete: bool
	staff_note: str | None = None
	updated_by: str | None = None


class TaskFeedbackRecord(TaskFeedbackPayload):
	updated_at: datetime


class TaskFeedbackResponse(BaseModel):
	accepted: bool
	message: str
	feedback: TaskFeedbackRecord


class TaskFeedbackListResponse(BaseModel):
	count: int
	items: list[TaskFeedbackRecord]


class FoodAvailabilityUpdate(BaseModel):
	item_name: str = Field(..., min_length=1)
	available_quantity: int = Field(..., ge=0)
	note: str | None = None


class FoodAvailabilityItem(BaseModel):
	item_name: str
	available_quantity: int
	is_available: bool
	updated_at: datetime
	note: str | None = None


class FoodAvailabilityResponse(BaseModel):
	count: int
	items: list[FoodAvailabilityItem]


class CafeteriaTaskCompletionPayload(BaseModel):
	instruction_id: str = Field(..., min_length=1)
	is_complete: bool = True
	staff_note: str | None = None
	updated_by: str | None = None
