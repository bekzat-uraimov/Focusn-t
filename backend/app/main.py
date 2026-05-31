import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, rooms, sessions, users
from app.tasks.scheduler import check_scheduled_sessions
from app.ws.room_ws import router as ws_router


async def _scheduler_loop() -> None:
    while True:
        try:
            await check_scheduled_sessions()
        except Exception:
            pass
        await asyncio.sleep(60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(_scheduler_loop())
    yield
    task.cancel()


app = FastAPI(title="FocusForest API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten before prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(rooms.router)
app.include_router(sessions.router)
app.include_router(users.router)
app.include_router(ws_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
