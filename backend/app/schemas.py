from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, Literal, List, Dict
import uuid


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserPublic(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserPublic


# ── Sessions ──────────────────────────────────────────────────────────────────

class SessionStartRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    mode: Literal["coding", "writing"]
    duration_seconds: int
    model_index: int
    room_id: Optional[uuid.UUID] = None


class SessionStartResponse(BaseModel):
    id: uuid.UUID
    started_at: datetime

    model_config = {"from_attributes": True}


class SessionCompleteRequest(BaseModel):
    avg_attention_score: float
    min_attention_score: float
    distraction_count: int
    total_distracted_secs: int


class SessionCompleteResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    session_id: uuid.UUID
    planet_id: uuid.UUID
    collection_index: int
    model_index: int


class SessionResponse(BaseModel):
    model_config = {"from_attributes": True, "protected_namespaces": ()}

    id: uuid.UUID
    mode: str
    duration_seconds: int
    started_at: datetime
    ended_at: Optional[datetime]
    result: Optional[str]
    avg_attention_score: Optional[float]
    model_index: int


# ── Galaxy ────────────────────────────────────────────────────────────────────

class PlanetResponse(BaseModel):
    id: uuid.UUID
    collection_index: int
    model_index: int
    created_at: datetime
    session: SessionResponse

    model_config = {"from_attributes": True}


class GalaxyResponse(BaseModel):
    planets: List[PlanetResponse]
    total_count: int


# ── Rooms ─────────────────────────────────────────────────────────────────────

class RoomCreateRequest(BaseModel):
    name: str
    is_private: bool = False
    scheduled_at: Optional[datetime] = None


class RoomResponse(BaseModel):
    id: uuid.UUID
    name: str
    is_private: bool
    invite_code: Optional[str]
    scheduled_at: Optional[datetime]
    status: str
    owner: UserPublic
    member_count: int

    model_config = {"from_attributes": True}


class RoomMemberResponse(BaseModel):
    user_id: uuid.UUID
    username: str
    focus_status: str
    attention_score: float

    model_config = {"from_attributes": True}


# ── Analytics ─────────────────────────────────────────────────────────────────

class AnalyticsSummary(BaseModel):
    total_sessions: int
    completed_sessions: int
    failed_sessions: int
    total_focus_minutes: int
    avg_attention_score: Optional[float]
    current_streak_days: int
    longest_streak_days: int
    mode_breakdown: Dict[str, int]
