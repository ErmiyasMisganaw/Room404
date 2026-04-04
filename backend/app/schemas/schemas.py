from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    name: str = Field(..., min_length=1, description="Basic user identity")
    message: str = Field(..., min_length=1, description="User message coming from the UI")
    room_number: str = Field(..., min_length=1, description="Guest's room number")
    role: str = Field(..., min_length=1, description="User role in the UI context")
    user_id: Optional[str] = Field(default=None, description="Optional stable user id")


class ResponseMeta(BaseModel):
    request_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    category: Optional[str] = None


class CustomerReplyData(BaseModel):
    user_id: str
    context_used: bool
    recent_history_count: int = 0


class CafeteriaOrderData(BaseModel):
    order_status: str
    requested_item: str
    alternatives: list[str] = Field(default_factory=list)
    routed_to_service: bool = False


class TaskAssignmentData(BaseModel):
    task_id: Optional[int] = None
    domain: str
    assigned_staff_id: Optional[int] = None
    priority: str = "Medium"
    eta_hint: Optional[str] = None
    assignment_status: str = "assigned"


class IgnoreData(BaseModel):
    reason: str
    task_created: bool = False
    notified_staff: bool = False


class AgentResponseEnvelope(BaseModel):
    ok: bool = True
    response_type: str
    message: str
    data: CustomerReplyData | CafeteriaOrderData | TaskAssignmentData | IgnoreData
    meta: ResponseMeta


class TaskOut(BaseModel):
    id: int
    category: str
    description: str
    room_number: str
    status: str
    priority: str
    staff_instruction: str
    assigned_staff_id: Optional[int] = None
    assigned_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
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
    accepted_by: Optional[str] = None
    accepted_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class FoodAvailabilityItem(BaseModel):
    item_name: str
    available_quantity: int = Field(default=0, ge=0)
    price: float = Field(default=0, ge=0)
    is_available: bool = True
    version: int = 1
    updated_by: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    note: Optional[str] = None


class MenuItemUpsertRequest(BaseModel):
    item_name: str = Field(..., min_length=1)
    available_quantity: int = Field(default=0, ge=0)
    price: float = Field(default=0, ge=0)
    is_available: bool = True
    note: Optional[str] = None
    updated_by: str = "cafeteria"
    updated_by_role: str = "cafeteria"


class MenuResponse(BaseModel):
    open: bool
    items: list[FoodAvailabilityItem]


class StaffLeaderboardItem(BaseModel):
    id: int
    name: str
    pool: str
    completed_task_count: int
    total_assigned_count: int
    active_task_count: int
    is_available: bool


class StaffLeaderboardResponse(BaseModel):
    pool: str
    items: list[StaffLeaderboardItem]


class AnalyticsTopFoodItem(BaseModel):
    name: str
    orders: int


class AnalyticsTopStaffItem(BaseModel):
    staff_id: int
    name: str
    completed_tasks: int


class AnalyticsTopMaintenanceTypeItem(BaseModel):
    type: str
    count: int


class ManagerAnalytics30dResponse(BaseModel):
    window_days: int = 30
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    total_tasks: int
    total_food_orders: int
    total_maintenance_tasks: int
    total_cleaner_tasks: int
    top_food: list[AnalyticsTopFoodItem]
    top_staff: list[AnalyticsTopStaffItem]
    top_maintenance_types: list[AnalyticsTopMaintenanceTypeItem]


class DispatchRequest(BaseModel):
    title: Optional[str] = None
    description: str = Field(..., min_length=1)
    category: str
    room: Optional[str] = "Unknown"
    priority: str = "Medium"
    response_to_guest: Optional[str] = None
    staff_instruction: Optional[str] = None


class DispatchResponse(BaseModel):
    instruction_id: str
    queue_name: str
    status: str


class InboxResponse(BaseModel):
    queue_name: str
    items: list[RoutedInstruction]


class TaskFeedbackUpdateRequest(BaseModel):
    instruction_id: str
    queue_name: str
    state: str
    note: Optional[str] = None
    accepted_by: Optional[str] = None


class CleanerAcceptTaskRequest(BaseModel):
    instruction_id: str
    note: Optional[str] = None


class TaskFeedbackQueueResponse(BaseModel):
    queue_name: str
    items: list[TaskFeedbackRecord]


class FoodAvailabilityResponse(BaseModel):
    open: bool
    items: list[FoodAvailabilityItem]


class CafeteriaAnalyticsResponse(BaseModel):
    window_days: int = 30
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    total_orders_30d: int
    completed_orders_30d: int
    pending_orders: int
    available_items: int
    total_items: int
    top_item: Optional[str] = None


class CafeteriaCompleteTaskRequest(BaseModel):
    instruction_id: str
    note: Optional[str] = None


class CustomerRequestItem(BaseModel):
    instruction_id: str
    type: str
    queue_name: str
    category: str
    message: str
    status: str
    priority: str
    created_at: datetime


class CustomerRequestsResponse(BaseModel):
    room_number: str
    items: list[CustomerRequestItem]
