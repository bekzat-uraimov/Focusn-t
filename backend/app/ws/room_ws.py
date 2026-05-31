import json
from datetime import datetime, timezone
from uuid import UUID

import jwt
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.core.security import decode_token
from app.db import SessionLocal
from app.models.session import Session
from app.models.tree import Tree, elapsed_to_stage
from app.models.user import User
from app.ws.room_manager import manager

router = APIRouter()


@router.websocket("/ws/rooms/{room_id}")
async def room_websocket(room_id: str, websocket: WebSocket, token: str = Query(...)):
    try:
        user_id = decode_token(token)
    except jwt.PyJWTError:
        await websocket.close(code=4001)
        return

    async with SessionLocal() as db:
        user = await db.get(User, UUID(user_id))
        if not user:
            await websocket.close(code=4001)
            return

    await websocket.accept()
    manager.connect(room_id, user_id, websocket)

    # Send current room state snapshot on join
    await manager.broadcast(
        room_id,
        {"type": "member_joined", "user_id": user_id, "name": user.name},
    )

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            msg_type = msg.get("type")

            if msg_type == "focus_update":
                status = msg.get("status", "focused")
                await manager.broadcast(
                    room_id,
                    {
                        "type": "member_update",
                        "user_id": user_id,
                        "name": user.name,
                        "status": status,
                        "tree_alive": True,
                    },
                )

            # session_end is handled via REST PATCH /sessions/{id}
            # which then calls manager.broadcast — no duplicate handling needed here

    except WebSocketDisconnect:
        manager.disconnect(room_id, user_id)
        await manager.broadcast(
            room_id,
            {"type": "member_left", "user_id": user_id},
        )

        # Auto-end any in_progress session for this user in this room
        async with SessionLocal() as db:
            session = await db.scalar(
                select(Session).where(
                    Session.user_id == UUID(user_id),
                    Session.room_id == UUID(room_id),
                    Session.status == "in_progress",
                )
            )
            if session:
                now = datetime.now(timezone.utc)
                elapsed = int((now - session.started_at.replace(tzinfo=timezone.utc)).total_seconds())
                session.status = "abandoned"
                session.ended_at = now

                tree = await db.scalar(select(Tree).where(Tree.session_id == session.id))
                if tree:
                    tree.stage = elapsed_to_stage(elapsed, session.duration_secs)
                    tree.is_alive = False
                    tree.in_forest = True
                    tree.died_at = now

                await db.commit()
                await db.refresh(session)

                await manager.broadcast(
                    room_id,
                    {
                        "type": "session_end",
                        "user_id": user_id,
                        "status": "abandoned",
                        "tree_alive": False,
                        "tree_type": tree.tree_type if tree else "common",
                        "in_forest": True,
                    },
                )
