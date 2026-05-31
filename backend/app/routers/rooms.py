import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import current_user
from app.db import get_db
from app.models.room import Room, RoomMember
from app.models.user import User
from app.schemas.room import MemberOut, RoomCreate, RoomJoin, RoomListItem, RoomOut

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.get("/explore", response_model=list[RoomListItem])
async def explore(db: AsyncSession = Depends(get_db), _: User = Depends(current_user)):
    rows = await db.execute(
        select(
            Room.id,
            Room.name,
            Room.is_open,
            Room.scheduled_at,
            func.count(RoomMember.user_id).label("member_count"),
        )
        .join(RoomMember, RoomMember.room_id == Room.id, isouter=True)
        .where(Room.is_open == True)
        .group_by(Room.id)
        .order_by(Room.created_at.desc())
        .limit(50)
    )
    return [RoomListItem(**dict(r._mapping)) for r in rows]


@router.post("", response_model=RoomOut, status_code=status.HTTP_201_CREATED)
async def create_room(body: RoomCreate, db: AsyncSession = Depends(get_db), user: User = Depends(current_user)):
    room = Room(
        name=body.name,
        owner_id=user.id,
        invite_code=secrets.token_urlsafe(6)[:8].upper(),
        is_open=body.is_open,
        scheduled_at=body.scheduled_at,
    )
    db.add(room)
    await db.flush()
    db.add(RoomMember(room_id=room.id, user_id=user.id))
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

    already = await db.get(RoomMember, (room_id, user.id))
    if not already:
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
