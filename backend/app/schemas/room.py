from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class RoomCreate(BaseModel):
    name: str
    is_open: bool = True
    scheduled_at: datetime | None = None


class RoomJoin(BaseModel):
    invite_code: str


class MemberOut(BaseModel):
    user_id: UUID
    name: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class RoomOut(BaseModel):
    id: UUID
    name: str
    owner_id: UUID
    invite_code: str
    is_open: bool
    scheduled_at: datetime | None
    created_at: datetime
    members: list[MemberOut] = []

    model_config = {"from_attributes": True}


class RoomListItem(BaseModel):
    id: UUID
    name: str
    is_open: bool
    scheduled_at: datetime | None
    member_count: int

    model_config = {"from_attributes": True}
