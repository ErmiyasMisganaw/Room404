import json
import re
from datetime import datetime, timezone
from uuid import uuid4
from typing import Any

import google.generativeai as genai
from fastapi import APIRouter, HTTPException

from app.core.config import GEMINI_API_KEY, GEMINI_MODEL_NAME
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

router = APIRouter(prefix="/api", tags=["chat"])

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
ACT AS: A professional Hotel Operations Agent.

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
- Complaints about staff, Refund requests, Overbilling, Room upgrades, Security concerns, Any relavant Information about the Hotel that's not Avaliable.

GENERAL POLICY:
- Check-in: 3pm. Check-out: 11am.
- Pool: 8am-8pm.
- Gym: 24 hours with room key.

STRICT RULES:
1. Answer questions using the KNOWLEDGE SOURCE above and any question related to this hotel only.
2. If the guest asks about something unrelated to Kuriftu Resort, reply exactly: "I am sorry, I can only assist with requests related to Kuriftu Resort."
3. Classify every input into one of these categories:
   - "Food": For orders or menu questions.
   - "Maintenance": For things that are broken.
   - "Workers": For housekeeping/item requests (pillows, towels).
   - "Manager": For complaints or any high-priority hotel issue.
   - "Ignore": For irrelevant things that do not need action.

OUTPUT FORMAT:
If the category is Manager, always ask the guest if they want the manager. Do not send anything to staff until the guest confirms.
Return only valid JSON.

JSON SCHEMA:
{
  "category": "Food | Maintenance | Workers | Manager | Ignore",
  "response_to_guest": "Write a polite reply here",
  "staff_instruction": "Write the exact instruction with the quantity",
  "priority": "Low | Medium | High"
}
""".strip()

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not configured.")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel(GEMINI_MODEL_NAME, system_instruction=SYSTEM_INSTRUCTIONS)


def _extract_json_payload(text: str) -> Any:
    cleaned_text = text.strip()

    if cleaned_text.startswith("```"):
        cleaned_text = re.sub(r"^```(?:json)?\s*", "", cleaned_text, flags=re.IGNORECASE).strip()
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3].strip()

    try:
        return json.loads(cleaned_text)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}|\[[\s\S]*\]", cleaned_text)
        if match:
            return json.loads(match.group(0))
        raise


@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/chat")
def chat(request: ChatRequest) -> Any:
    try:
        response = model.generate_content(request.message)
        if not response.text:
            raise HTTPException(status_code=502, detail="Gemini returned an empty response.")
        return _extract_json_payload(response.text)
    except HTTPException:
        raise
    except Exception as exc:
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
