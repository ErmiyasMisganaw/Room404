from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.models import StaffMember, Task


DEFAULT_COOLDOWN_MINUTES = 20


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def select_staff_for_pool(db: Session, pool: str) -> StaffMember | None:
    now = utcnow()
    normalized_pool = (pool or "").strip().lower()
    candidate_pools = ["cleaners", "workers"] if normalized_pool == "cleaners" else [normalized_pool]
    candidates = (
        db.query(StaffMember)
        .filter(StaffMember.pool.in_(candidate_pools), StaffMember.is_available.is_(True))
        .all()
    )

    eligible = [
        staff
        for staff in candidates
        if staff.cooldown_until is None or staff.cooldown_until <= now
    ]

    if not eligible:
        return None

    oldest = datetime(1970, 1, 1)
    eligible.sort(key=lambda s: (s.active_task_count, s.last_assigned_at or oldest))
    return eligible[0]


def assign_task_to_staff(
    db: Session,
    task: Task,
    pool: str,
    cooldown_minutes: int = DEFAULT_COOLDOWN_MINUTES,
) -> StaffMember | None:
    selected = select_staff_for_pool(db=db, pool=pool)
    if not selected:
        return None

    now = utcnow()
    selected.active_task_count = int(selected.active_task_count or 0) + 1
    selected.total_assigned_count = int(selected.total_assigned_count or 0) + 1
    selected.last_assigned_at = now
    selected.cooldown_until = now + timedelta(minutes=cooldown_minutes)
    selected.updated_at = now

    task.assigned_staff_id = selected.id
    task.assigned_at = now
    task.updated_at = now
    return selected


def apply_task_completion_effects(db: Session, task: Task) -> None:
    if task.completed_at is not None:
        return

    now = utcnow()
    task.completed_at = now
    task.updated_at = now

    if task.assigned_staff_id is None:
        return

    staff = db.query(StaffMember).filter(StaffMember.id == task.assigned_staff_id).first()
    if not staff:
        return

    staff.active_task_count = max(0, int(staff.active_task_count or 0) - 1)
    staff.completed_task_count = int(staff.completed_task_count or 0) + 1
    staff.updated_at = now
