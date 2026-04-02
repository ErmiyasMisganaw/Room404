import json
import re
from typing import Any

import google.generativeai as genai
from fastapi import APIRouter, HTTPException

from app.core.config import GEMINI_API_KEY, GEMINI_MODEL_NAME
from app.schemas.schemas import ChatRequest

router = APIRouter(prefix="/api", tags=["chat"])

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
