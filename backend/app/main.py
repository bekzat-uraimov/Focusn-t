from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, rooms, sessions, users
from app.ws.room_ws import router as ws_router

app = FastAPI(title="FocusForest API", version="0.1.0")

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
