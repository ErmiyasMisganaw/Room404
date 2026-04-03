import json
import re
from datetime import datetime, timezone
<<<<<<< HEAD
from uuid import uuid4
=======
>>>>>>> df4014dc84d564f79ffcbf2eb63f913cab7b628e
from typing import Any

import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.config import GEMINI_API_KEY, GEMINI_MODEL_NAME
<<<<<<< HEAD
from app.schemas.schemas import (
    AIDispatchPayload,
    CafeteriaTaskCompletionPayload,
    ChatRequest,
    DispatchResponse,
    FoodAvailabilityItem,
    FoodAvailabilityResponse,
    FoodAvailabilityUpdate,
    QueueResponse,
    RoutedInstruction,
    TaskFeedbackListResponse,
    TaskFeedbackPayload,
    TaskFeedbackRecord,
    TaskFeedbackResponse,
)
=======
from app.db.database import get_db
from app.models.models import Room, Task
from app.schemas.schemas import ChatRequest, RoomOut, TaskOut, TaskStatusUpdate
>>>>>>> df4014dc84d564f79ffcbf2eb63f913cab7b628e

router = APIRouter(prefix="/api", tags=["api"])


# ---------------------------------------------------------------------------
# WebSocket connection manager
# ---------------------------------------------------------------------------

class ConnectionManager:
    def __init__(self) -> None:
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket) -> None:
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, event_type: str, data: dict) -> None:
        payload = json.dumps({"type": event_type, "data": data})
        dead: list[WebSocket] = []
        for ws in self.active:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()


# ---------------------------------------------------------------------------
# Gemini AI setup
# ---------------------------------------------------------------------------

QUEUE_BY_CATEGORY: dict[str, list[RoutedInstruction]] = {
    "food": [],
    "maintenance": [],
    "workers": [],
    "manager": [],
    "ignore": [],
}

CATEGORY_TO_QUEUE = {
    "Food": "food",
    "Maintenance": "maintenance",
    "Workers": "workers",
    "Manager": "manager",
    "Ignore": "ignore",
}

TASK_FEEDBACK_BY_ID: dict[str, TaskFeedbackRecord] = {}

FOOD_AVAILABILITY_BY_ITEM: dict[str, FoodAvailabilityItem] = {
    "pasta": FoodAvailabilityItem(
        item_name="Pasta",
        available_quantity=12,
        is_available=True,
        updated_at=datetime.now(timezone.utc),
        note="Initial stock",
    ),
    "club sandwich": FoodAvailabilityItem(
        item_name="Club Sandwich",
        available_quantity=8,
        is_available=True,
        updated_at=datetime.now(timezone.utc),
        note="Initial stock",
    ),
    "orange juice": FoodAvailabilityItem(
        item_name="Orange Juice",
        available_quantity=20,
        is_available=True,
        updated_at=datetime.now(timezone.utc),
        note="Initial stock",
    ),
}

SYSTEM_INSTRUCTIONS = """
ACT AS: A professional Hotel Operations Agent for Kuriftu Resort.

KNOWLEDGE SOURCE:
HOTEL NAME: Kuriftu Resort
FOOD & DINING:
- Breakfast: 7am-10am.
- Room Service: 24/7.
- Bar: Open 4pm-11pm.

MAINTENANCE ISSUES:
- AC not working, Leaking faucet, Lightbulb out, TV remote issues, Wi-Fi connectivity.

WORKERS / HOUSEKEEPING REQUESTS:
- Extra pillows, Towels, Toothbrush kit, Ironing board, Room cleaning, Luggage help.

MANAGER ESCALATION:
- Complaints about staff, Refund requests, Overbilling, Room upgrades, Security concerns.

GENERAL POLICY:
- Check-in: 3pm. Check-out: 11am.
- Pool: 8am-8pm.
- Gym: 24 hours with room key.

STRICT RULES:
1. Answer ONLY questions related to Kuriftu Resort.
2. If unrelated, reply: "I am sorry, I can only assist with requests related to Kuriftu Resort."
3. Classify every input:
   - "Food": Food orders or menu questions.
   - "Maintenance": Broken/malfunctioning items.
   - "Workers": Housekeeping or item requests (pillows, towels).
   - "Manager": Complaints, refunds, upgrades, security.
   - "Ignore": Irrelevant or already handled.

OUTPUT FORMAT: Return ONLY valid JSON. No markdown.

JSON SCHEMA:
{
  "category": "Food | Maintenance | Workers | Manager | Ignore",
  "response_to_guest": "Warm, professional reply for the guest",
  "staff_instruction": "Exact instruction with item and quantity for staff",
  "priority": "Low | Medium | High"
}
""".strip()

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not configured.")

genai.configure(api_key=GEMINI_API_KEY)
_gemini = genai.GenerativeModel(GEMINI_MODEL_NAME, system_instruction=SYSTEM_INSTRUCTIONS)


def _parse_json(text: str) -> Any:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE).strip()
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3].strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", cleaned)
        if match:
            return json.loads(match.group(0))
        raise


def _task_dict(task: Task) -> dict:
    return {
        "id": task.id,
        "category": task.category,
        "description": task.description,
        "room_number": task.room_number,
        "status": task.status,
        "priority": task.priority,
        "staff_instruction": task.staff_instruction,
        "created_at": task.created_at.isoformat() if task.created_at else None,
    }


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# WebSocket
# ---------------------------------------------------------------------------

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()   # keep-alive ping/pong
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ---------------------------------------------------------------------------
# Chat / AI agent with function calling
# ---------------------------------------------------------------------------

@router.post("/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db)) -> Any:
    try:
        response = _gemini.generate_content(request.message)
        if not response.text:
            raise HTTPException(status_code=502, detail="Gemini returned an empty response.")

        payload = _parse_json(response.text)
        category: str = payload.get("category", "Ignore")

        # Auto-create a task for actionable categories
        if category not in ("Ignore", "Manager"):
            task = Task(
                category=category,
                description=request.message,
                room_number=request.room_number,
                status="Pending",
                priority=payload.get("priority", "Medium"),
                staff_instruction=payload.get("staff_instruction", ""),
            )
            db.add(task)
            db.commit()
            db.refresh(task)

            await manager.broadcast("new_task", _task_dict(task))
            payload["task_id"] = task.id

        return payload

    except HTTPException:
        raise
    except Exception as exc:
<<<<<<< HEAD
        raise HTTPException(status_code=500, detail=f"Failed to generate a Gemini response: {exc}") from exc


def _build_routed_instruction(payload: AIDispatchPayload) -> RoutedInstruction:
    queue_name = CATEGORY_TO_QUEUE[payload.category]
    return RoutedInstruction(
        instruction_id=f"ins-{uuid4().hex[:12]}",
        category=payload.category,
        response_to_guest=payload.response_to_guest,
        staff_instruction=payload.staff_instruction,
        priority=payload.priority,
        target_queue=queue_name,
        created_at=datetime.now(timezone.utc),
    )


@router.post("/dispatch", response_model=DispatchResponse)
def receive_ai_dispatch(payload: AIDispatchPayload) -> DispatchResponse:
    routed_instruction = _build_routed_instruction(payload)
    QUEUE_BY_CATEGORY[routed_instruction.target_queue].append(routed_instruction)

    if routed_instruction.target_queue == "ignore":
        return DispatchResponse(
            accepted=True,
            message="Instruction was accepted but categorized as Ignore, so no staff action is required.",
            routed_instruction=routed_instruction,
        )

    return DispatchResponse(
        accepted=True,
        message=f"Instruction routed to {routed_instruction.target_queue} queue.",
        routed_instruction=routed_instruction,
    )


def _read_queue(queue_name: str, consume: bool) -> QueueResponse:
    if queue_name not in QUEUE_BY_CATEGORY:
        raise HTTPException(status_code=404, detail="Queue not found.")

    items = QUEUE_BY_CATEGORY[queue_name]
    response_items = list(items)

    if consume:
        QUEUE_BY_CATEGORY[queue_name] = []

    return QueueResponse(
        queue=queue_name,
        count=len(response_items),
        items=response_items,
    )


def _instruction_exists_in_queue(queue_name: str, instruction_id: str) -> bool:
    return any(item.instruction_id == instruction_id for item in QUEUE_BY_CATEGORY.get(queue_name, []))


def _feedback_list_for_queue(queue_name: str) -> list[TaskFeedbackRecord]:
    queue_instruction_ids = {item.instruction_id for item in QUEUE_BY_CATEGORY.get(queue_name, [])}
    return [
        feedback
        for feedback in TASK_FEEDBACK_BY_ID.values()
        if feedback.queue == queue_name or feedback.instruction_id in queue_instruction_ids
    ]


@router.get("/inbox/food", response_model=QueueResponse)
def get_food_inbox(consume: bool = False) -> QueueResponse:
    return _read_queue("food", consume)


@router.get("/inbox/maintenance", response_model=QueueResponse)
def get_maintenance_inbox(consume: bool = False) -> QueueResponse:
    return _read_queue("maintenance", consume)


@router.get("/inbox/workers", response_model=QueueResponse)
def get_workers_inbox(consume: bool = False) -> QueueResponse:
    return _read_queue("workers", consume)


@router.get("/inbox/manager", response_model=QueueResponse)
def get_manager_inbox(consume: bool = False) -> QueueResponse:
    return _read_queue("manager", consume)


@router.post("/feedback/task-state", response_model=TaskFeedbackResponse)
def report_task_state(payload: TaskFeedbackPayload) -> TaskFeedbackResponse:
    if not _instruction_exists_in_queue(payload.queue, payload.instruction_id):
        raise HTTPException(
            status_code=404,
            detail=(
                f"Instruction '{payload.instruction_id}' was not found in '{payload.queue}' queue. "
                "Fetch the queue first and use a valid instruction_id."
            ),
        )

    feedback = TaskFeedbackRecord(
        instruction_id=payload.instruction_id,
        queue=payload.queue,
        state=payload.state,
        is_complete=payload.is_complete,
        staff_note=payload.staff_note,
        updated_by=payload.updated_by,
        updated_at=datetime.now(timezone.utc),
    )
    TASK_FEEDBACK_BY_ID[payload.instruction_id] = feedback

    return TaskFeedbackResponse(
        accepted=True,
        message="Task feedback recorded successfully.",
        feedback=feedback,
    )


@router.get("/feedback/task-state/{instruction_id}", response_model=TaskFeedbackResponse)
def get_task_state(instruction_id: str) -> TaskFeedbackResponse:
    feedback = TASK_FEEDBACK_BY_ID.get(instruction_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="No feedback found for this instruction.")

    return TaskFeedbackResponse(
        accepted=True,
        message="Task feedback fetched successfully.",
        feedback=feedback,
    )


@router.get("/feedback/task-state/queue/{queue_name}", response_model=TaskFeedbackListResponse)
def get_queue_task_feedback(queue_name: str) -> TaskFeedbackListResponse:
    if queue_name not in QUEUE_BY_CATEGORY:
        raise HTTPException(status_code=404, detail="Queue not found.")

    items = _feedback_list_for_queue(queue_name)
    return TaskFeedbackListResponse(count=len(items), items=items)


@router.get("/cafeteria/availability", response_model=FoodAvailabilityResponse)
def get_food_availability() -> FoodAvailabilityResponse:
    items = sorted(FOOD_AVAILABILITY_BY_ITEM.values(), key=lambda item: item.item_name.lower())
    return FoodAvailabilityResponse(count=len(items), items=items)


@router.post("/cafeteria/availability", response_model=FoodAvailabilityItem)
def update_food_availability(payload: FoodAvailabilityUpdate) -> FoodAvailabilityItem:
    key = payload.item_name.strip().lower()
    if not key:
        raise HTTPException(status_code=400, detail="item_name cannot be empty.")

    updated_item = FoodAvailabilityItem(
        item_name=payload.item_name.strip(),
        available_quantity=payload.available_quantity,
        is_available=payload.available_quantity > 0,
        updated_at=datetime.now(timezone.utc),
        note=payload.note,
    )
    FOOD_AVAILABILITY_BY_ITEM[key] = updated_item
    return updated_item


@router.post("/cafeteria/complete-task", response_model=TaskFeedbackResponse)
def complete_cafeteria_task(payload: CafeteriaTaskCompletionPayload) -> TaskFeedbackResponse:
    if not _instruction_exists_in_queue("food", payload.instruction_id):
        raise HTTPException(
            status_code=404,
            detail="Instruction was not found in food queue.",
        )

    feedback = TaskFeedbackRecord(
        instruction_id=payload.instruction_id,
        queue="food",
        state="Completed" if payload.is_complete else "In Progress",
        is_complete=payload.is_complete,
        staff_note=payload.staff_note,
        updated_by=payload.updated_by,
        updated_at=datetime.now(timezone.utc),
    )
    TASK_FEEDBACK_BY_ID[payload.instruction_id] = feedback

    return TaskFeedbackResponse(
        accepted=True,
        message="Cafeteria task completion status recorded.",
        feedback=feedback,
    )
=======
        raise HTTPException(status_code=500, detail=f"AI agent error: {exc}") from exc


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

@router.get("/tasks", response_model=list[TaskOut])
def get_tasks(db: Session = Depends(get_db)) -> list[Task]:
    return db.query(Task).order_by(Task.created_at.desc()).all()


@router.patch("/tasks/{task_id}", response_model=TaskOut)
async def update_task_status(
    task_id: int,
    update: TaskStatusUpdate,
    db: Session = Depends(get_db),
) -> Task:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    task.status = update.status
    task.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(task)

    await manager.broadcast("task_updated", {
        "id": task.id,
        "category": task.category,
        "status": task.status,
        "room_number": task.room_number,
    })

    return task


# ---------------------------------------------------------------------------
# Rooms
# ---------------------------------------------------------------------------

@router.get("/rooms", response_model=list[RoomOut])
def get_rooms(db: Session = Depends(get_db)) -> list[Room]:
    return db.query(Room).order_by(Room.room_number).all()


@router.post("/rooms/{room_number}/checkout")
async def trigger_checkout(room_number: str, db: Session = Depends(get_db)) -> dict:
    room = db.query(Room).filter(Room.room_number == room_number).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")
    if room.status != "Occupied":
        raise HTTPException(status_code=400, detail="Room is not currently occupied.")

    room.status = "Cleaning Needed"
    room.assigned_guest = None

    # Auto-create a cleaning task
    task = Task(
        category="Workers",
        description=f"Checkout cleaning required for room {room_number}",
        room_number=room_number,
        status="Pending",
        priority="High",
        staff_instruction=f"Room {room_number} checked out. Clean and prepare for next guest immediately.",
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    await manager.broadcast("room_checkout", {
        "room_number": room_number,
        "new_status": "Cleaning Needed",
        "task_id": task.id,
    })
    await manager.broadcast("new_task", _task_dict(task))

    return {"room_number": room_number, "status": "Cleaning Needed", "task_id": task.id}


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)) -> dict:
    tasks = db.query(Task).all()

    by_category: dict[str, int] = {}
    by_status: dict[str, int] = {}

    for task in tasks:
        by_category[task.category] = by_category.get(task.category, 0) + 1
        by_status[task.status] = by_status.get(task.status, 0) + 1

    most_requested = max(by_category, key=lambda k: by_category[k]) if by_category else "N/A"

    rooms = db.query(Room).all()
    total_rooms = len(rooms)
    occupied = sum(1 for r in rooms if r.status == "Occupied")
    cleaning_needed = sum(1 for r in rooms if r.status == "Cleaning Needed")
    occupancy_rate = round(occupied / total_rooms * 100, 1) if total_rooms else 0.0

    return {
        "total_tasks": len(tasks),
        "by_category": by_category,
        "by_status": by_status,
        "most_requested": most_requested,
        "total_rooms": total_rooms,
        "occupied_rooms": occupied,
        "cleaning_needed": cleaning_needed,
        "occupancy_rate": occupancy_rate,
    }
>>>>>>> df4014dc84d564f79ffcbf2eb63f913cab7b628e
