from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..database import get_db
from ..models import User, FocusSession
from ..auth import get_current_user
from ..schemas import AnalyticsSummary, SessionResponse

router = APIRouter()


@router.get("/summary", response_model=AnalyticsSummary)
def get_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = db.query(FocusSession).filter(FocusSession.user_id == user.id).all()
    completed = [s for s in sessions if s.result == "completed"]
    failed    = [s for s in sessions if s.result == "failed"]

    total_minutes = sum(s.duration_seconds for s in completed) // 60

    scores = [s.avg_attention_score for s in completed if s.avg_attention_score is not None]
    avg_score = sum(scores) / len(scores) if scores else None

    mode_breakdown: dict = {}
    for s in sessions:
        mode_breakdown[s.mode] = mode_breakdown.get(s.mode, 0) + 1

    completed_dates = sorted({s.started_at.date() for s in completed}, reverse=True)
    today = datetime.utcnow().date()
    current_streak = 0
    longest_streak = 0
    streak = 0
    for i, d in enumerate(completed_dates):
        expected = today - timedelta(days=i)
        if d == expected:
            streak += 1
            if i == 0:
                current_streak = streak
        else:
            longest_streak = max(longest_streak, streak)
            streak = 1
    longest_streak = max(longest_streak, streak, current_streak)

    return AnalyticsSummary(
        total_sessions=len(sessions),
        completed_sessions=len(completed),
        failed_sessions=len(failed),
        total_focus_minutes=total_minutes,
        avg_attention_score=avg_score,
        current_streak_days=current_streak,
        longest_streak_days=longest_streak,
        mode_breakdown=mode_breakdown,
    )


@router.get("/sessions", response_model=list[SessionResponse])
def get_sessions(
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(FocusSession)
        .filter(FocusSession.user_id == user.id)
        .order_by(FocusSession.started_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
