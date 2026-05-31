from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import current_user
from app.db import get_db
from app.models.room import RoomMember
from app.models.session import Session
from app.models.tree import Tree, duration_to_tree_type, elapsed_to_stage
from app.models.user import User
from app.schemas.session import SessionCreate, SessionEnd, SessionOut
from app.ws.room_manager import manager

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("/current", response_model=SessionOut)
async def get_current_session(
    room_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    session = await db.scalar(
        select(Session).where(
            Session.user_id == user.id,
            Session.room_id == room_id,
            Session.status.in_(["in_progress", "scheduled"]),
        )
    )
    if not session:
        raise HTTPException(status_code=404, detail="No active session")
    return SessionOut.model_validate(session)


@router.post("", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
async def start_session(body: SessionCreate, db: AsyncSession = Depends(get_db), user: User = Depends(current_user)):
    member = await db.get(RoomMember, (body.room_id, user.id))
    if not member:
        raise HTTPException(status_code=403, detail="You must join the room before starting a session")

    active = await db.scalar(
        select(Session).where(
            Session.user_id == user.id,
            Session.status == "in_progress",
        )
    )
    if active:
        raise HTTPException(status_code=409, detail="You already have an active session")

    session = Session(
        user_id=user.id,
        room_id=body.room_id,
        duration_secs=body.duration_secs,
    )
    db.add(session)
    await db.flush()

    tree = Tree(
        session_id=session.id,
        user_id=user.id,
        tree_type=duration_to_tree_type(body.duration_secs),
        stage="small",
        is_alive=True,
        in_forest=False,
    )
    db.add(tree)
    await db.commit()
    await db.refresh(session)

    await manager.broadcast(
        str(body.room_id),
        {
            "type": "member_update",
            "user_id": str(user.id),
            "name": user.name,
            "status": "focused",
            "tree_alive": True,
        },
    )
    return SessionOut.model_validate(session)


@router.patch("/{session_id}", response_model=SessionOut)
async def end_session(
    session_id,
    body: SessionEnd,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    session = await db.get(Session, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "in_progress":
        raise HTTPException(status_code=409, detail="Session already ended")

    session.status = body.status
    session.ended_at = datetime.now(timezone.utc)

    tree = await db.scalar(select(Tree).where(Tree.session_id == session.id))
    final_stage = elapsed_to_stage(body.elapsed_secs, session.duration_secs)
    tree.stage = final_stage

    if body.status == "completed":
        tree.in_forest = True
    elif body.status == "abandoned":
        tree.is_alive = False
        tree.in_forest = True
        tree.died_at = datetime.now(timezone.utc)
    else:  # failed
        tree.is_alive = False
        tree.died_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(session)

    await manager.broadcast(
        str(session.room_id),
        {
            "type": "session_end",
            "user_id": str(user.id),
            "status": body.status,
            "tree_alive": tree.is_alive,
            "tree_type": tree.tree_type,
            "in_forest": tree.in_forest,
        },
    )
    return SessionOut.model_validate(session)
