from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.db import SessionLocal
from app.models.room import Room
from app.models.session import Session
from app.models.tree import Tree
from app.ws.room_manager import manager

GRACE_MINUTES = 10


async def check_scheduled_sessions() -> None:
    """Starts overdue scheduled sessions or kills no-shows."""
    now = datetime.now(timezone.utc)
    grace_deadline = now - timedelta(minutes=GRACE_MINUTES)

    async with SessionLocal() as db:
        rows = (await db.execute(
            select(Session, Room)
            .join(Room, Room.id == Session.room_id)
            .where(
                Session.status == "scheduled",
                Room.scheduled_at <= now,
            )
        )).all()

        for session, room in rows:
            room_id = str(room.id)
            user_id = str(session.user_id)
            owner_connected = user_id in manager.room_state(room_id)

            if owner_connected:
                session.status = "in_progress"
                await db.commit()
                await manager.broadcast(
                    room_id,
                    {
                        "type": "session_started",
                        "user_id": user_id,
                        "duration_secs": session.duration_secs,
                        "session_id": str(session.id),
                    },
                )
            elif room.scheduled_at.replace(tzinfo=timezone.utc) <= grace_deadline:
                session.status = "abandoned"
                session.ended_at = now

                tree = await db.scalar(select(Tree).where(Tree.session_id == session.id))
                if tree:
                    tree.is_alive = False
                    tree.in_forest = True
                    tree.died_at = now

                await db.commit()
                await manager.broadcast(
                    room_id,
                    {
                        "type": "session_dead",
                        "user_id": user_id,
                    },
                )
