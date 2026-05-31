import secrets
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db, SessionLocal
from ..models import User, Room, RoomMember
from ..auth import get_current_user, decode_token
from ..schemas import RoomCreateRequest, RoomResponse, RoomMemberResponse
from ..websocket.manager import manager

router = APIRouter()


# ── REST ──────────────────────────────────────────────────────────────────────

@router.post("", response_model=RoomResponse, status_code=201)
def create_room(
    body: RoomCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invite = secrets.token_urlsafe(8) if body.is_private else None
    room = Room(
        owner_id=user.id,
        name=body.name,
        is_private=body.is_private,
        invite_code=invite,
        scheduled_at=body.scheduled_at,
        status="scheduled",
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    # Auto-join owner
    db.add(RoomMember(room_id=room.id, user_id=user.id))
    db.commit()
    return _room_response(room, db)


@router.get("", response_model=list[RoomResponse])
def list_rooms(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rooms = (
        db.query(Room)
        .filter(Room.is_private == False, Room.status != "ended")
        .order_by(Room.scheduled_at.nullslast(), Room.created_at.desc())
        .all()
    )
    return [_room_response(r, db) for r in rooms]


@router.post("/{room_id}/join")
def join_room(
    room_id: str,
    invite_code: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = _get_room(room_id, db)
    if room.is_private and room.invite_code != invite_code:
        raise HTTPException(403, "Invalid invite code")
    existing = db.query(RoomMember).filter(
        RoomMember.room_id == room.id,
        RoomMember.user_id == user.id,
    ).first()
    if not existing:
        db.add(RoomMember(room_id=room.id, user_id=user.id))
        db.commit()
    return {"ok": True, "room_id": str(room.id)}


@router.get("/{room_id}/members", response_model=list[RoomMemberResponse])
def get_members(
    room_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_room(room_id, db)
    members = db.query(RoomMember).filter(RoomMember.room_id == room_id).all()
    return [
        RoomMemberResponse(
            user_id=m.user_id,
            username=m.user.username,
            focus_status=m.focus_status,
            attention_score=m.attention_score,
        )
        for m in members
    ]


# ── WebSocket ─────────────────────────────────────────────────────────────────

@router.websocket("/ws/{room_id}")
async def room_websocket(ws: WebSocket, room_id: str):
    await ws.accept()
    user = None
    db: Session = SessionLocal()
    try:
        # First message must be auth
        init_msg = await ws.receive_json()
        if init_msg.get("type") != "join_room":
            await ws.close(code=4001)
            return
        token = init_msg.get("token", "")
        payload = decode_token(token)
        user_id = payload["sub"]

        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            await ws.close(code=4004)
            return
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            await ws.close(code=4001)
            return

        await manager.connect(room_id, user_id, ws)

        if room.status == "scheduled":
            room.status = "active"
            db.commit()

        await manager.broadcast(room_id, {
            "type": "member_joined",
            "user_id": str(user.id),
            "username": user.username,
        }, exclude=ws)

        while True:
            data = await ws.receive_json()
            if data.get("type") == "focus_update":
                status_val = data.get("status", "focused")
                score = float(data.get("score", 100))
                member = db.query(RoomMember).filter(
                    RoomMember.room_id == room_id,
                    RoomMember.user_id == user_id,
                ).first()
                if member:
                    member.focus_status = status_val
                    member.attention_score = score
                    db.commit()
                await manager.broadcast(room_id, {
                    "type": "member_update",
                    "user_id": str(user.id),
                    "username": user.username,
                    "status": status_val,
                    "score": score,
                })

    except WebSocketDisconnect:
        manager.disconnect(room_id, ws)
        if user:
            await manager.broadcast(room_id, {
                "type": "member_left",
                "user_id": str(user.id),
                "username": user.username,
            })
    except Exception:
        manager.disconnect(room_id, ws)
    finally:
        db.close()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_room(room_id: str, db: Session) -> Room:
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(404, "Room not found")
    return room


def _room_response(room: Room, db: Session) -> RoomResponse:
    count = db.query(RoomMember).filter(RoomMember.room_id == room.id).count()
    return RoomResponse(
        id=room.id,
        name=room.name,
        is_private=room.is_private,
        invite_code=room.invite_code,
        scheduled_at=room.scheduled_at,
        status=room.status,
        owner=room.owner,
        member_count=count,
    )
