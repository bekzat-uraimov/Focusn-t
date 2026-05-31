import secrets
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import current_user
from app.db import get_db
from app.models.room import Room, RoomMember
from app.models.session import Session
from app.models.tree import Tree, duration_to_tree_type
from app.models.user import User
from app.schemas.room import MemberOut, RoomCreate, RoomJoin, RoomListItem, RoomOut

router = APIRouter(prefix="/rooms", tags=["rooms"])

_ACTIVE_STATUSES = ["in_progress", "scheduled"]


@router.get("/explore", response_model=list[RoomListItem])
async def explore(db: AsyncSession = Depends(get_db), _: User = Depends(current_user)):
    rows = await db.execute(
        select(
            Room.id,
            Room.name,
            Room.is_open,
            Room.scheduled_at,
            Room.scheduled_duration_secs,
            func.count(RoomMember.user_id).label("member_count"),
        )
        .join(Session, (Session.room_id == Room.id) & (Session.status == "scheduled"))
        .join(RoomMember, RoomMember.room_id == Room.id, isouter=True)
        .where(Room.is_open == True)
        .group_by(Room.id)
        .order_by(Room.scheduled_at.asc())
        .limit(50)
    )
    result = []
    for r in rows:
        d = dict(r._mapping)
        if d["scheduled_at"] and d["scheduled_duration_secs"]:
            d["scheduled_ends_at"] = d["scheduled_at"] + timedelta(seconds=d["scheduled_duration_secs"])
        else:
            d["scheduled_ends_at"] = None
        result.append(RoomListItem(**d))
    return result


@router.post("", response_model=RoomOut, status_code=status.HTTP_201_CREATED)
async def create_room(body: RoomCreate, db: AsyncSession = Depends(get_db), user: User = Depends(current_user)):
    if body.scheduled_at and not body.scheduled_duration_secs:
        raise HTTPException(status_code=422, detail="scheduled_duration_secs is required when scheduled_at is set")

    if body.scheduled_at and body.scheduled_duration_secs:
        conflict = await db.scalar(
            select(Session).where(
                Session.user_id == user.id,
                Session.status.in_(_ACTIVE_STATUSES),
            )
        )
        if conflict:
            raise HTTPException(status_code=409, detail="Finish your current session before scheduling a new one")

    room = Room(
        name=body.name,
        owner_id=user.id,
        invite_code=secrets.token_urlsafe(6)[:8].upper(),
        is_open=body.is_open,
        scheduled_at=body.scheduled_at,
        scheduled_duration_secs=body.scheduled_duration_secs,
    )
    db.add(room)
    await db.flush()
    db.add(RoomMember(room_id=room.id, user_id=user.id))

    if body.scheduled_at and body.scheduled_duration_secs:
        session = Session(
            user_id=user.id,
            room_id=room.id,
            duration_secs=body.scheduled_duration_secs,
            status="scheduled",
        )
        db.add(session)
        await db.flush()
        db.add(Tree(
            session_id=session.id,
            user_id=user.id,
            tree_type=duration_to_tree_type(body.scheduled_duration_secs),
            stage="small",
            is_alive=True,
            in_forest=False,
        ))

    await db.commit()
    await db.refresh(room)
    return await _room_with_members(room.id, db)


@router.get("/{room_id}", response_model=RoomOut)
async def get_room(room_id, db: AsyncSession = Depends(get_db), _: User = Depends(current_user)):
    room = await db.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return await _room_with_members(room_id, db)


@router.post("/{room_id}/join", response_model=RoomOut)
async def join_room(room_id, body: RoomJoin, db: AsyncSession = Depends(get_db), user: User = Depends(current_user)):
    room = await db.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room.invite_code != body.invite_code:
        raise HTTPException(status_code=403, detail="Invalid invite code")

    # Block if the room's session has already started
    room_active = await db.scalar(
        select(Session).where(Session.room_id == room_id, Session.status == "in_progress")
    )
    if room_active:
        raise HTTPException(status_code=409, detail="This session has already started")

    # Block if the user already has an active or scheduled session
    already = await db.get(RoomMember, (room_id, user.id))
    if not already:
        user_busy = await db.scalar(
            select(Session).where(
                Session.user_id == user.id,
                Session.status.in_(_ACTIVE_STATUSES),
            )
        )
        if user_busy:
            raise HTTPException(status_code=409, detail="Finish your current session before joining another")

        db.add(RoomMember(room_id=room_id, user_id=user.id))
        await db.commit()
    return await _room_with_members(room_id, db)


@router.post("/{room_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_room(room_id, db: AsyncSession = Depends(get_db), user: User = Depends(current_user)):
    member = await db.get(RoomMember, (room_id, user.id))
    if member:
        await db.delete(member)
        await db.commit()


async def _room_with_members(room_id, db: AsyncSession) -> RoomOut:
    room = await db.get(Room, room_id)
    rows = await db.execute(
        select(User.id.label("user_id"), User.name, RoomMember.joined_at)
        .join(User, User.id == RoomMember.user_id)
        .where(RoomMember.room_id == room_id)
    )
    members = [MemberOut(**dict(r._mapping)) for r in rows]
    out = RoomOut.model_validate(room)
    out.members = members
    return out
