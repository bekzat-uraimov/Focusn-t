import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean,
    DateTime, ForeignKey, Enum as SAEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, DeclarativeBase


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email         = Column(String(255), unique=True, nullable=False, index=True)
    username      = Column(String(64), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at    = Column(DateTime, default=datetime.utcnow, nullable=False)

    sessions         = relationship("FocusSession", back_populates="user")
    planets          = relationship("Planet", back_populates="user")
    owned_rooms      = relationship("Room", back_populates="owner")
    room_memberships = relationship("RoomMember", back_populates="user")


class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id                    = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id               = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    room_id               = Column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=True, index=True)
    mode                  = Column(SAEnum("coding", "writing", name="focus_mode"), nullable=False)
    duration_seconds      = Column(Integer, nullable=False)
    started_at            = Column(DateTime, nullable=False, default=datetime.utcnow)
    ended_at              = Column(DateTime, nullable=True)
    result                = Column(
        SAEnum("completed", "failed", "abandoned", name="session_result"),
        nullable=True,
    )
    avg_attention_score   = Column(Float, nullable=True)
    min_attention_score   = Column(Float, nullable=True)
    distraction_count     = Column(Integer, default=0)
    total_distracted_secs = Column(Integer, default=0)
    model_index           = Column(Integer, nullable=False, default=0)

    user   = relationship("User", back_populates="sessions")
    room   = relationship("Room")
    planet = relationship("Planet", back_populates="session", uselist=False)


class Planet(Base):
    __tablename__ = "planets"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id          = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    session_id       = Column(UUID(as_uuid=True), ForeignKey("focus_sessions.id"), nullable=False, unique=True)
    collection_index = Column(Integer, nullable=False)
    model_index      = Column(Integer, nullable=False)
    created_at       = Column(DateTime, default=datetime.utcnow, nullable=False)

    user    = relationship("User", back_populates="planets")
    session = relationship("FocusSession", back_populates="planet")


class Room(Base):
    __tablename__ = "rooms"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id     = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name         = Column(String(128), nullable=False)
    is_private   = Column(Boolean, default=False, nullable=False)
    invite_code  = Column(String(16), unique=True, nullable=True, index=True)
    scheduled_at = Column(DateTime, nullable=True)
    status       = Column(
        SAEnum("scheduled", "active", "ended", name="room_status"),
        default="scheduled", nullable=False,
    )
    created_at   = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner   = relationship("User", back_populates="owned_rooms")
    members = relationship("RoomMember", back_populates="room")


class RoomMember(Base):
    __tablename__ = "room_members"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id         = Column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=False, index=True)
    user_id         = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    joined_at       = Column(DateTime, default=datetime.utcnow, nullable=False)
    focus_status    = Column(String(20), default="idle")
    attention_score = Column(Float, default=100.0)

    room = relationship("Room", back_populates="members")
    user = relationship("User", back_populates="room_memberships")
