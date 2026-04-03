from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.db.database import Base, SessionLocal, engine
from app.models import models  # noqa: F401 — registers ORM models before create_all


def _seed_rooms(db) -> None:
    """Insert default rooms on first run if the table is empty."""
    if db.query(models.Room).count() > 0:
        return

    initial_rooms = [
        {"room_number": "101", "type": "Single", "status": "Available"},
        {"room_number": "102", "type": "Single", "status": "Occupied", "assigned_guest": "Marta B."},
        {"room_number": "103", "type": "Single", "status": "Cleaning Needed"},
        {"room_number": "201", "type": "Double", "status": "Available"},
        {"room_number": "202", "type": "Double", "status": "Occupied", "assigned_guest": "Daniel K."},
        {"room_number": "203", "type": "Double", "status": "Available"},
        {"room_number": "301", "type": "Suite", "status": "Cleaning Needed"},
        {"room_number": "302", "type": "Suite", "status": "Available"},
        {"room_number": "303", "type": "Suite", "status": "Occupied", "assigned_guest": "Aster M."},
        {"room_number": "401", "type": "Suite", "status": "Available"},
        {"room_number": "210", "type": "Double", "status": "Occupied", "assigned_guest": "Mikal D."},
        {"room_number": "212", "type": "Double", "status": "Occupied", "assigned_guest": "Ruth G."},
    ]

    for data in initial_rooms:
        room = models.Room(**data)
        db.add(room)

    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        _seed_rooms(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Room404 Hotel AI Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Room404 Hotel AI backend is running"}
