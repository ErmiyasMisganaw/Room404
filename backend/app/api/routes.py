import json
import re
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.config import GEMINI_API_KEY, GEMINI_MODEL_NAME
from app.db.database import get_db
from app.models.models import FoodAvailability, Room, RoutedInstruction, Task, TaskFeedback
from app.schemas.schemas import (
    CafeteriaCompleteTaskRequest,
    ChatRequest,
    DispatchRequest,
    DispatchResponse,
    FoodAvailabilityItem,
    FoodAvailabilityResponse,
    InboxResponse,
    RoomOut,
    RoutedInstruction as RoutedInstructionSchema,
    TaskFeedbackQueueResponse,
    TaskFeedbackRecord,
    TaskFeedbackUpdateRequest,
    TaskOut,
    TaskStatusUpdate,
)

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

CATEGORY_TO_QUEUE = {
    "Food": "food",
    "Maintenance": "maintenance",
    "Workers": "workers",
    "Manager": "manager",
    "Ignore": "ignore",
}

VALID_QUEUES = {"food", "maintenance", "workers", "manager", "ignore"}

STATE_TO_TASK_STATUS = {
    "pending": "Pending",
    "in_progress": "In Progress",
    "completed": "Done",
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


def _normalize_queue(value: str) -> str:
    lowered = (value or "").strip().lower()
    if lowered in VALID_QUEUES:
        return lowered
    titled = (value or "").strip().title()
    return CATEGORY_TO_QUEUE.get(titled, "ignore")


def _normalize_state(value: str) -> str:
    normalized = (value or "pending").strip().lower().replace(" ", "_")
    if normalized in {"pending", "in_progress", "completed"}:
        return normalized
    return "pending"


def _instruction_to_schema(record: RoutedInstruction) -> RoutedInstructionSchema:
    return RoutedInstructionSchema(
        instruction_id=record.instruction_id,
        category=record.category,
        response_to_guest=record.response_to_guest,
        staff_instruction=record.staff_instruction,
        priority=record.priority,
        room=record.room,
        title=record.title,
        description=record.description,
        status=record.status,
        created_at=record.created_at,
    )


def _feedback_to_schema(record: TaskFeedback) -> TaskFeedbackRecord:
    return TaskFeedbackRecord(
        instruction_id=record.instruction_id,
        queue_name=record.queue_name,
        state=record.state,
        note=record.note,
        updated_at=record.updated_at,
    )


def _food_to_schema(record: FoodAvailability) -> FoodAvailabilityItem:
    return FoodAvailabilityItem(
        item_name=record.item_name,
        available_quantity=record.available_quantity,
        is_available=record.is_available,
        updated_at=record.updated_at,
        note=record.note,
    )


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

            instruction = RoutedInstruction(
                instruction_id=f"t-{task.id}",
                queue_name=_normalize_queue(category),
                category=category,
                title="AI chat request",
                description=request.message,
                room=request.room_number,
                priority=payload.get("priority", "Medium"),
                response_to_guest=payload.get("response_to_guest", ""),
                staff_instruction=payload.get("staff_instruction", ""),
                status="pending",
                linked_task_id=task.id,
            )
            db.add(instruction)
            db.commit()

            await manager.broadcast("new_task", _task_dict(task))
            payload["task_id"] = task.id

        return payload

    except HTTPException:
        raise
    except Exception as exc:
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
# Dispatch / Inbox / Feedback / Cafeteria (DB-backed)
# ---------------------------------------------------------------------------

@router.post("/dispatch", response_model=DispatchResponse)
def dispatch_instruction(payload: DispatchRequest, db: Session = Depends(get_db)) -> DispatchResponse:
    queue_name = _normalize_queue(payload.category)
    instruction_id = str(uuid4())
    normalized_priority = (payload.priority or "Medium").strip().title()

    instruction = RoutedInstruction(
        instruction_id=instruction_id,
        queue_name=queue_name,
        category=payload.category.strip().title(),
        title=payload.title or "Guest request",
        description=payload.description,
        room=payload.room or "Unknown",
        priority=normalized_priority,
        response_to_guest=payload.response_to_guest or "",
        staff_instruction=payload.staff_instruction or payload.description,
        status="pending",
    )
    db.add(instruction)

    if queue_name in {"food", "maintenance", "workers"}:
        task = Task(
            category=instruction.category,
            description=payload.description,
            room_number=payload.room or "Unknown",
            status="Pending",
            priority=normalized_priority,
            staff_instruction=instruction.staff_instruction,
        )
        db.add(task)
        db.flush()
        instruction.linked_task_id = task.id

    db.commit()

    return DispatchResponse(
        instruction_id=instruction_id,
        queue_name=queue_name,
        status="queued",
    )


@router.get("/inbox/{queue_name}", response_model=InboxResponse)
def get_inbox(queue_name: str, db: Session = Depends(get_db)) -> InboxResponse:
    normalized_queue = _normalize_queue(queue_name)
    if normalized_queue not in VALID_QUEUES:
        raise HTTPException(status_code=400, detail="Invalid queue name")

    rows = (
        db.query(RoutedInstruction)
        .filter(RoutedInstruction.queue_name == normalized_queue)
        .order_by(RoutedInstruction.created_at.desc())
        .all()
    )

    return InboxResponse(
        queue_name=normalized_queue,
        items=[_instruction_to_schema(row) for row in rows],
    )


@router.post("/feedback/task-state", response_model=TaskFeedbackRecord)
def upsert_task_feedback(payload: TaskFeedbackUpdateRequest, db: Session = Depends(get_db)) -> TaskFeedbackRecord:
    normalized_queue = _normalize_queue(payload.queue_name)
    normalized_state = _normalize_state(payload.state)
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    record = (
        db.query(TaskFeedback)
        .filter(TaskFeedback.instruction_id == payload.instruction_id)
        .first()
    )
    if record:
        record.queue_name = normalized_queue
        record.state = normalized_state
        record.note = payload.note or ""
        record.updated_at = now
    else:
        record = TaskFeedback(
            instruction_id=payload.instruction_id,
            queue_name=normalized_queue,
            state=normalized_state,
            note=payload.note or "",
            updated_at=now,
        )
        db.add(record)

    instruction = (
        db.query(RoutedInstruction)
        .filter(RoutedInstruction.instruction_id == payload.instruction_id)
        .first()
    )
    if instruction:
        instruction.status = normalized_state
        instruction.updated_at = now
        if instruction.linked_task_id:
            task = db.query(Task).filter(Task.id == instruction.linked_task_id).first()
            if task:
                task.status = STATE_TO_TASK_STATUS.get(normalized_state, task.status)
                task.updated_at = now

    db.commit()
    db.refresh(record)
    return _feedback_to_schema(record)


@router.get("/feedback/task-state/{instruction_id}", response_model=TaskFeedbackRecord)
def get_task_feedback(instruction_id: str, db: Session = Depends(get_db)) -> TaskFeedbackRecord:
    record = db.query(TaskFeedback).filter(TaskFeedback.instruction_id == instruction_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return _feedback_to_schema(record)


@router.get("/feedback/task-state/queue/{queue_name}", response_model=TaskFeedbackQueueResponse)
def get_task_feedback_queue(queue_name: str, db: Session = Depends(get_db)) -> TaskFeedbackQueueResponse:
    normalized_queue = _normalize_queue(queue_name)
    rows = (
        db.query(TaskFeedback)
        .filter(TaskFeedback.queue_name == normalized_queue)
        .order_by(TaskFeedback.updated_at.desc())
        .all()
    )
    return TaskFeedbackQueueResponse(
        queue_name=normalized_queue,
        items=[_feedback_to_schema(row) for row in rows],
    )


@router.get("/cafeteria/availability", response_model=FoodAvailabilityResponse)
def get_cafeteria_availability(db: Session = Depends(get_db)) -> FoodAvailabilityResponse:
    items = db.query(FoodAvailability).order_by(FoodAvailability.item_name.asc()).all()
    mapped = [_food_to_schema(item) for item in items]
    is_open = any(item.is_available and item.available_quantity > 0 for item in mapped)
    return FoodAvailabilityResponse(open=is_open, items=mapped)


@router.post("/cafeteria/availability", response_model=FoodAvailabilityResponse)
def upsert_cafeteria_availability(item: FoodAvailabilityItem, db: Session = Depends(get_db)) -> FoodAvailabilityResponse:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    key = item.item_name.strip()

    row = db.query(FoodAvailability).filter(FoodAvailability.item_name == key).first()
    if row:
        row.available_quantity = item.available_quantity
        row.is_available = item.is_available
        row.note = item.note or ""
        row.updated_at = now
    else:
        row = FoodAvailability(
            item_name=key,
            available_quantity=item.available_quantity,
            is_available=item.is_available,
            note=item.note or "",
            updated_at=now,
        )
        db.add(row)

    db.commit()
    return get_cafeteria_availability(db)


@router.post("/cafeteria/complete-task", response_model=TaskFeedbackRecord)
def complete_cafeteria_task(payload: CafeteriaCompleteTaskRequest, db: Session = Depends(get_db)) -> TaskFeedbackRecord:
    feedback = upsert_task_feedback(
        TaskFeedbackUpdateRequest(
            instruction_id=payload.instruction_id,
            queue_name="food",
            state="completed",
            note=payload.note or "Cafeteria marked as complete",
        ),
        db,
    )
    return feedback


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
