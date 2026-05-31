from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TreeOut(BaseModel):
    id: UUID
    session_id: UUID
    tree_type: str
    stage: str
    is_alive: bool
    in_forest: bool
    died_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserProfile(UserOut):
    forest: list[TreeOut] = []
