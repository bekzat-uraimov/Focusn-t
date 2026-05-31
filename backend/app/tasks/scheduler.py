from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.db import SessionLocal
from app.models.room import Room
from app.models.session import Session
from app.models.tree import Tree
from app.ws.room_manager import manager

GRACE_MINUTES = 10


async def check_scheduled_sessions() -> None:
    """
    Runs every 60 s.
    1. Starts scheduled sessions whose time has come (owner connected).
    2. Kills no-shows after GRACE_MINUTES.
    3. Force-completes in_progress sessions that have exceeded their duration.
    """
    now = datetime.now(timezone.utc)
    grace_deadline = now - timedelta(minutes=GRACE_MINUTES)

    async with SessionLocal() as db:

        # ── 1 & 2: handle scheduled sessions ────────────────────────────────
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
                # Fix: record the real start time so end-time math is correct
                session.status = "in_progress"
                session.started_at = now
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
                # Owner no-show: dead tree in forest
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
                    {"type": "session_dead", "user_id": user_id},
                )

        # ── 3: force-complete overdue in_progress sessions ──────────────────
        overdue_rows = (await db.execute(
            select(Session).where(Session.status == "in_progress")
        )).scalars().all()

        for session in overdue_rows:
            start = session.started_at
            if start.tzinfo is None:
                start = start.replace(tzinfo=timezone.utc)
            if (now - start).total_seconds() < session.duration_secs:
                continue

            session.status = "completed"
            session.ended_at = now
            tree = await db.scalar(select(Tree).where(Tree.session_id == session.id))
            if tree:
                tree.stage = "large"
                tree.in_forest = True
            await db.commit()
            await manager.broadcast(
                str(session.room_id),
                {
                    "type": "session_end",
                    "user_id": str(session.user_id),
                    "status": "completed",
                    "tree_alive": True,
                    "tree_type": tree.tree_type if tree else "common",
                    "in_forest": True,
                },
            )
