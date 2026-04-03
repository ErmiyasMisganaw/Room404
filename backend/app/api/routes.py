import json
import re
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.config import GEMINI_API_KEY, GEMINI_MODEL_NAME, STAFF_COOLDOWN_MINUTES
from app.db.database import get_db
from app.models.models import ChatMemory, FoodAvailability, Room, RoutedInstruction, StaffMember, Task, TaskFeedback
from app.schemas.schemas import (
    AgentResponseEnvelope,
    CafeteriaCompleteTaskRequest,
    CafeteriaOrderData,
    ChatRequest,
    CustomerReplyData,
    DispatchRequest,
    DispatchResponse,
    FoodAvailabilityItem,
    FoodAvailabilityResponse,
    IgnoreData,
    InboxResponse,
    MenuItemUpsertRequest,
    MenuResponse,
    ResponseMeta,
    RoomOut,
    RoutedInstruction as RoutedInstructionSchema,
    StaffLeaderboardItem,
    StaffLeaderboardResponse,
    TaskAssignmentData,
    TaskFeedbackQueueResponse,
    TaskFeedbackRecord,
    TaskFeedbackUpdateRequest,
    TaskOut,
    TaskStatusUpdate,
)
from app.services.assignment import apply_task_completion_effects, assign_task_to_staff

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


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


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
        "assigned_staff_id": task.assigned_staff_id,
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
        version=record.version,
        updated_by=record.updated_by,
        updated_at=record.updated_at,
        note=record.note,
    )


def _normalize_category(value: str) -> str:
    normalized = (value or "").strip().title()
    aliases = {
        "Worker": "Workers",
        "Workers": "Workers",
        "Housekeeping": "Workers",
        "Cleaning": "Workers",
        "Food": "Food",
        "Maintenance": "Maintenance",
        "Manager": "Manager",
        "Ignore": "Ignore",
    }
    return aliases.get(normalized, "Manager")


def _build_user_key(request: ChatRequest) -> str:
    if request.user_id and request.user_id.strip():
        return request.user_id.strip().lower()
    return f"{request.name.strip().lower()}::{request.room_number.strip()}"


def _get_recent_chat_lines(db: Session, user_key: str, limit: int = 5) -> list[ChatMemory]:
    rows = (
        db.query(ChatMemory)
        .filter(ChatMemory.user_key == user_key)
        .order_by(ChatMemory.created_at.desc(), ChatMemory.id.desc())
        .limit(limit)
        .all()
    )
    rows.reverse()
    return rows


def _append_chat_line(db: Session, user_key: str, role: str, line: str) -> None:
    entry = ChatMemory(user_key=user_key, role=role, line=line)
    db.add(entry)
    db.flush()

    ordered_rows = (
        db.query(ChatMemory)
        .filter(ChatMemory.user_key == user_key)
        .order_by(ChatMemory.created_at.desc(), ChatMemory.id.desc())
        .all()
    )
    for stale in ordered_rows[5:]:
        db.delete(stale)


def _extract_requested_item(message: str, items: list[FoodAvailability]) -> str:
    lowered = message.lower()
    for item in sorted(items, key=lambda row: len(row.item_name), reverse=True):
        if item.item_name.lower() in lowered:
            return item.item_name
    return ""


def _fallback_classification(message: str) -> dict[str, str]:
    lowered = (message or "").lower()

    ignore_hints = ["never mind", "nevermind", "ignore this", "cancel that", "no need"]
    food_hints = ["food", "menu", "eat", "meal", "breakfast", "lunch", "dinner", "juice", "order"]
    maintenance_hints = ["ac", "air condition", "leak", "broken", "wifi", "tv", "light", "faucet"]
    worker_hints = ["clean", "cleaning", "towel", "pillows", "toothbrush", "housekeeping", "luggage"]
    manager_hints = ["complaint", "refund", "upgrade", "security", "manager"]

    if any(hint in lowered for hint in ignore_hints):
        category = "Ignore"
    elif any(hint in lowered for hint in food_hints):
        category = "Food"
    elif any(hint in lowered for hint in maintenance_hints):
        category = "Maintenance"
    elif any(hint in lowered for hint in worker_hints):
        category = "Workers"
    elif any(hint in lowered for hint in manager_hints):
        category = "Manager"
    else:
        category = "Manager"

    return {
        "category": category,
        "response_to_guest": "We received your request and will handle it shortly.",
        "staff_instruction": message,
        "priority": "Medium",
    }


def _classify_with_context(
    message: str,
    history: list[ChatMemory],
    available_menu: list[str],
) -> dict[str, Any]:
    history_block = "\n".join(f"{line.role}: {line.line}" for line in history) or "none"
    menu_block = ", ".join(available_menu) if available_menu else "none"

    prompt = (
        "Use the system instructions and return only JSON with the required schema.\n"
        "Recent conversation (max 5 lines):\n"
        f"{history_block}\n"
        "Currently available menu items:\n"
        f"{menu_block}\n"
        "User request:\n"
        f"{message}"
    )

    try:
        response = _gemini.generate_content(prompt)
        if response.text:
            payload = _parse_json(response.text)
            if isinstance(payload, dict):
                return payload
    except Exception:
        pass

    return _fallback_classification(message)


def _upsert_menu_item(
    db: Session,
    *,
    item_name: str,
    available_quantity: int,
    is_available: bool,
    note: str,
    updated_by: str,
) -> None:
    now = _utcnow()
    key = item_name.strip()

    row = db.query(FoodAvailability).filter(FoodAvailability.item_name == key).first()
    if row:
        row.available_quantity = available_quantity
        row.is_available = is_available
        row.note = note
        row.version = int(row.version or 1) + 1
        row.updated_by = updated_by
        row.updated_at = now
        return

    db.add(
        FoodAvailability(
            item_name=key,
            available_quantity=available_quantity,
            is_available=is_available,
            note=note,
            version=1,
            updated_by=updated_by,
            updated_at=now,
        )
    )


def _build_menu_response(db: Session, include_unavailable: bool) -> MenuResponse:
    rows_query = db.query(FoodAvailability)
    if not include_unavailable:
        rows_query = rows_query.filter(
            FoodAvailability.is_available.is_(True),
            FoodAvailability.available_quantity > 0,
        )

    rows = rows_query.order_by(FoodAvailability.item_name.asc()).all()
    all_rows = db.query(FoodAvailability).all()
    is_open = any(item.is_available and item.available_quantity > 0 for item in all_rows)
    return MenuResponse(open=is_open, items=[_food_to_schema(item) for item in rows])


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

async def _handle_customer_request(
    *,
    request: ChatRequest,
    payload: dict[str, Any],
    request_id: str,
    user_key: str,
    recent_history_count: int,
    category: str,
) -> AgentResponseEnvelope:
    message = payload.get("response_to_guest") or "We received your request and will handle it shortly."
    return AgentResponseEnvelope(
        ok=True,
        response_type="customer_reply",
        message=message,
        data=CustomerReplyData(
            user_id=request.user_id or user_key,
            context_used=recent_history_count > 0,
            recent_history_count=recent_history_count,
        ),
        meta=ResponseMeta(request_id=request_id, category=category),
    )


async def _handle_ignore_request(
    *,
    payload: dict[str, Any],
    request_id: str,
) -> AgentResponseEnvelope:
    message = payload.get("response_to_guest") or "Request acknowledged. No action was required."
    return AgentResponseEnvelope(
        ok=True,
        response_type="ignore",
        message=message,
        data=IgnoreData(
            reason="ignored_by_policy",
            task_created=False,
            notified_staff=False,
        ),
        meta=ResponseMeta(request_id=request_id, category="Ignore"),
    )


async def _handle_task_assignment_request(
    *,
    db: Session,
    request: ChatRequest,
    payload: dict[str, Any],
    request_id: str,
    category: str,
    domain: str,
) -> AgentResponseEnvelope:
    normalized_priority = (payload.get("priority") or "Medium").strip().title()
    staff_instruction = payload.get("staff_instruction") or request.message

    task = Task(
        category=category,
        description=request.message,
        room_number=request.room_number,
        status="Pending",
        priority=normalized_priority,
        staff_instruction=staff_instruction,
    )
    db.add(task)
    db.flush()

    selected_staff = assign_task_to_staff(
        db=db,
        task=task,
        pool=_normalize_queue(category),
        cooldown_minutes=STAFF_COOLDOWN_MINUTES,
    )

    db.add(
        RoutedInstruction(
            instruction_id=f"t-{task.id}",
            queue_name=_normalize_queue(category),
            category=category,
            title="AI chat request",
            description=request.message,
            room=request.room_number,
            priority=normalized_priority,
            response_to_guest=payload.get("response_to_guest") or "",
            staff_instruction=staff_instruction,
            status="pending",
            linked_task_id=task.id,
        )
    )

    db.commit()
    db.refresh(task)

    await manager.broadcast("new_task", _task_dict(task))

    if selected_staff:
        default_message = "A staff member has been assigned and is on the way."
        assignment_status = "assigned"
        assigned_staff_id = selected_staff.id
    else:
        default_message = "Your request is queued and will be assigned shortly."
        assignment_status = "queued_unassigned"
        assigned_staff_id = None

    message = payload.get("response_to_guest") or default_message
    return AgentResponseEnvelope(
        ok=True,
        response_type="task_assignment",
        message=message,
        data=TaskAssignmentData(
            task_id=task.id,
            domain=domain,
            assigned_staff_id=assigned_staff_id,
            priority=normalized_priority,
            eta_hint="Based on current queue",
            assignment_status=assignment_status,
        ),
        meta=ResponseMeta(request_id=request_id, category=category),
    )


async def _handle_cafeteria_request(
    *,
    db: Session,
    request: ChatRequest,
    request_id: str,
) -> AgentResponseEnvelope:
    menu_rows = db.query(FoodAvailability).order_by(FoodAvailability.item_name.asc()).all()
    available_rows = [
        row
        for row in menu_rows
        if row.is_available and int(row.available_quantity or 0) > 0
    ]
    available_names = [row.item_name for row in available_rows]
    requested_item = _extract_requested_item(request.message, menu_rows)

    if not available_rows:
        return AgentResponseEnvelope(
            ok=True,
            response_type="cafeteria_order",
            message="food unavailable. No menu items are currently available.",
            data=CafeteriaOrderData(
                order_status="unavailable",
                requested_item=requested_item or "unknown",
                alternatives=[],
                routed_to_service=False,
            ),
            meta=ResponseMeta(request_id=request_id, category="Food"),
        )

    if not requested_item:
        return AgentResponseEnvelope(
            ok=True,
            response_type="cafeteria_order",
            message="food unavailable. Requested item is not on the menu right now.",
            data=CafeteriaOrderData(
                order_status="unavailable",
                requested_item="unknown",
                alternatives=available_names[:3],
                routed_to_service=False,
            ),
            meta=ResponseMeta(request_id=request_id, category="Food"),
        )

    if requested_item and requested_item not in available_names:
        alternatives = [item for item in available_names if item != requested_item][:3]
        return AgentResponseEnvelope(
            ok=True,
            response_type="cafeteria_order",
            message=f"food unavailable: {requested_item}. Please choose one of the alternatives.",
            data=CafeteriaOrderData(
                order_status="unavailable",
                requested_item=requested_item,
                alternatives=alternatives,
                routed_to_service=False,
            ),
            meta=ResponseMeta(request_id=request_id, category="Food"),
        )

    normalized_priority = "Medium"
    staff_instruction = f"Prepare {requested_item} for room {request.room_number}."

    task = Task(
        category="Food",
        description=request.message,
        room_number=request.room_number,
        status="Pending",
        priority=normalized_priority,
        staff_instruction=staff_instruction,
    )
    db.add(task)
    db.flush()

    db.add(
        RoutedInstruction(
            instruction_id=f"t-{task.id}",
            queue_name="food",
            category="Food",
            title="AI cafeteria request",
            description=request.message,
            room=request.room_number,
            priority=normalized_priority,
            response_to_guest="",
            staff_instruction=staff_instruction,
            status="pending",
            linked_task_id=task.id,
        )
    )

    db.commit()
    db.refresh(task)

    await manager.broadcast("new_task", _task_dict(task))

    return AgentResponseEnvelope(
        ok=True,
        response_type="cafeteria_order",
        message="Your food is ordered and will arrive shortly.",
        data=CafeteriaOrderData(
            order_status="accepted",
            requested_item=requested_item,
            alternatives=[name for name in available_names if name != requested_item][:3],
            routed_to_service=True,
        ),
        meta=ResponseMeta(request_id=request_id, category="Food"),
    )


@router.post("/chat", response_model=AgentResponseEnvelope)
async def chat(request: ChatRequest, db: Session = Depends(get_db)) -> AgentResponseEnvelope:
    try:
        request_id = str(uuid4())
        user_key = _build_user_key(request)
        history = _get_recent_chat_lines(db, user_key=user_key, limit=5)
        available_menu = [
            item.item_name
            for item in db.query(FoodAvailability)
            .filter(FoodAvailability.is_available.is_(True), FoodAvailability.available_quantity > 0)
            .order_by(FoodAvailability.item_name.asc())
            .all()
        ]

        payload = _classify_with_context(
            message=request.message,
            history=history,
            available_menu=available_menu,
        )
        category = _normalize_category(payload.get("category", "Ignore"))

        if category == "Food":
            envelope = await _handle_cafeteria_request(
                db=db,
                request=request,
                request_id=request_id,
            )
        elif category == "Workers":
            envelope = await _handle_task_assignment_request(
                db=db,
                request=request,
                payload=payload,
                request_id=request_id,
                category=category,
                domain="cleaning",
            )
        elif category == "Maintenance":
            envelope = await _handle_task_assignment_request(
                db=db,
                request=request,
                payload=payload,
                request_id=request_id,
                category=category,
                domain="maintenance",
            )
        elif category == "Ignore":
            envelope = await _handle_ignore_request(payload=payload, request_id=request_id)
        else:
            envelope = await _handle_customer_request(
                request=request,
                payload=payload,
                request_id=request_id,
                user_key=user_key,
                recent_history_count=len(history),
                category=category,
            )

        _append_chat_line(db, user_key=user_key, role="user", line=request.message)
        _append_chat_line(db, user_key=user_key, role="assistant", line=envelope.message)
        db.commit()

        return envelope

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

    normalized = (update.status or "").strip().lower().replace(" ", "_")
    if normalized in {"completed", "done"}:
        task.status = "Done"
        apply_task_completion_effects(db, task)
    elif normalized == "in_progress":
        task.status = "In Progress"
        task.updated_at = _utcnow()
    elif normalized == "pending":
        task.status = "Pending"
        task.updated_at = _utcnow()
    else:
        task.status = update.status
        task.updated_at = _utcnow()

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
async def dispatch_instruction(payload: DispatchRequest, db: Session = Depends(get_db)) -> DispatchResponse:
    queue_name = _normalize_queue(payload.category)
    instruction_id = str(uuid4())
    normalized_priority = (payload.priority or "Medium").strip().title()
    task: Task | None = None

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
        if queue_name in {"maintenance", "workers"}:
            assign_task_to_staff(
                db=db,
                task=task,
                pool=queue_name,
                cooldown_minutes=STAFF_COOLDOWN_MINUTES,
            )

    db.commit()

    if task:
        db.refresh(task)
        await manager.broadcast("new_task", _task_dict(task))

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
    now = _utcnow()

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
                if normalized_state == "completed":
                    apply_task_completion_effects(db, task)

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
    menu = _build_menu_response(db, include_unavailable=True)
    return FoodAvailabilityResponse(open=menu.open, items=menu.items)


@router.post("/cafeteria/availability", response_model=FoodAvailabilityResponse)
def upsert_cafeteria_availability(item: FoodAvailabilityItem, db: Session = Depends(get_db)) -> FoodAvailabilityResponse:
    _upsert_menu_item(
        db,
        item_name=item.item_name,
        available_quantity=item.available_quantity,
        is_available=item.is_available,
        note=item.note or "",
        updated_by=item.updated_by or "cafeteria",
    )
    db.commit()
    return get_cafeteria_availability(db)


@router.get("/menu", response_model=MenuResponse)
def get_menu(
    include_unavailable: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> MenuResponse:
    return _build_menu_response(db, include_unavailable=include_unavailable)


@router.post("/menu", response_model=MenuResponse)
def upsert_menu(item: MenuItemUpsertRequest, db: Session = Depends(get_db)) -> MenuResponse:
    if item.updated_by_role.strip().lower() != "cafeteria":
        raise HTTPException(status_code=403, detail="Only cafeteria staff can update menu items.")

    _upsert_menu_item(
        db,
        item_name=item.item_name,
        available_quantity=item.available_quantity,
        is_available=item.is_available,
        note=item.note or "",
        updated_by=item.updated_by,
    )
    db.commit()
    return _build_menu_response(db, include_unavailable=True)


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


@router.get("/staff/leaderboard", response_model=StaffLeaderboardResponse)
def get_staff_leaderboard(
    pool: str = Query(default="workers"),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
) -> StaffLeaderboardResponse:
    normalized_pool = pool.strip().lower()
    if normalized_pool not in {"workers", "maintenance"}:
        raise HTTPException(status_code=400, detail="pool must be 'workers' or 'maintenance'")

    rows = (
        db.query(StaffMember)
        .filter(StaffMember.pool == normalized_pool)
        .order_by(
            StaffMember.completed_task_count.desc(),
            StaffMember.total_assigned_count.desc(),
            StaffMember.active_task_count.asc(),
            StaffMember.id.asc(),
        )
        .limit(limit)
        .all()
    )

    return StaffLeaderboardResponse(
        pool=normalized_pool,
        items=[
            StaffLeaderboardItem(
                id=row.id,
                name=row.name,
                pool=row.pool,
                completed_task_count=int(row.completed_task_count or 0),
                total_assigned_count=int(row.total_assigned_count or 0),
                active_task_count=int(row.active_task_count or 0),
                is_available=bool(row.is_available),
            )
            for row in rows
        ],
    )


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
    db.flush()

    selected_staff = assign_task_to_staff(
        db=db,
        task=task,
        pool="workers",
        cooldown_minutes=STAFF_COOLDOWN_MINUTES,
    )

    db.add(
        RoutedInstruction(
            instruction_id=str(uuid4()),
            queue_name="workers",
            category="Workers",
            title="Checkout cleaning",
            description=task.description,
            room=room_number,
            priority="High",
            response_to_guest="",
            staff_instruction=task.staff_instruction,
            status="pending",
            linked_task_id=task.id,
        )
    )

    db.commit()
    db.refresh(task)

    await manager.broadcast("room_checkout", {
        "room_number": room_number,
        "new_status": "Cleaning Needed",
        "task_id": task.id,
    })
    await manager.broadcast("new_task", _task_dict(task))

    return {
        "room_number": room_number,
        "status": "Cleaning Needed",
        "task_id": task.id,
        "assigned_staff_id": selected_staff.id if selected_staff else None,
    }


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
