from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, field_validator

ALLOWED_DURATIONS = {1800, 2700, 3600, 5400, 7200}


class SessionCreate(BaseModel):
    room_id: UUID
    duration_secs: int

    @field_validator("duration_secs")
    @classmethod
    def must_be_allowed(cls, v: int) -> int:
        if v not in ALLOWED_DURATIONS:
            raise ValueError(f"duration_secs must be one of {sorted(ALLOWED_DURATIONS)}")
        return v


class SessionEnd(BaseModel):
    status: Literal["completed", "failed", "abandoned"]
    elapsed_secs: int


class SessionOut(BaseModel):
    id: UUID
    user_id: UUID
    room_id: UUID
    duration_secs: int
    started_at: datetime
    ended_at: datetime | None
    status: str

    model_config = {"from_attributes": True}
