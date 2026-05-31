from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base

DURATION_TO_TREE_TYPE = {
    1800: "common",
    2700: "uncommon",
    3600: "epic",
    5400: "arcane",
    7200: "diamond",
}

TREE_STAGE_THRESHOLDS = [
    (0.33, "small"),
    (0.66, "medium"),
    (1.0, "large"),
]


def duration_to_tree_type(duration_secs: int) -> str:
    return DURATION_TO_TREE_TYPE[duration_secs]


def elapsed_to_stage(elapsed_secs: int, duration_secs: int) -> str:
    ratio = elapsed_secs / duration_secs
    for threshold, stage in TREE_STAGE_THRESHOLDS:
        if ratio <= threshold:
            return stage
    return "large"


class Tree(Base):
    __tablename__ = "trees"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    session_id: Mapped[UUID] = mapped_column(ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tree_type: Mapped[str] = mapped_column(
        Enum("common", "uncommon", "epic", "arcane", "diamond", name="tree_type"),
        nullable=False,
    )
    stage: Mapped[str] = mapped_column(
        Enum("small", "medium", "large", name="tree_stage"),
        default="small",
        nullable=False,
    )
    is_alive: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    in_forest: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    died_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
