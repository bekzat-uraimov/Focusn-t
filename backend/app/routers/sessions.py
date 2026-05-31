from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import User, FocusSession, Planet
from ..auth import get_current_user
from ..schemas import (
    SessionStartRequest, SessionStartResponse,
    SessionCompleteRequest, SessionCompleteResponse,
)

router = APIRouter()


@router.post("", response_model=SessionStartResponse, status_code=201)
def start_session(
    body: SessionStartRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = FocusSession(
        user_id=user.id,
        room_id=body.room_id,
        mode=body.mode,
        duration_seconds=body.duration_seconds,
        model_index=body.model_index,
        started_at=datetime.utcnow(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return SessionStartResponse(id=session.id, started_at=session.started_at)


@router.post("/{session_id}/complete", response_model=SessionCompleteResponse)
def complete_session(
    session_id: str,
    body: SessionCompleteRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = _get_owned_session(session_id, user.id, db)
    session.result = "completed"
    session.ended_at = datetime.utcnow()
    session.avg_attention_score = body.avg_attention_score
    session.min_attention_score = body.min_attention_score
    session.distraction_count = body.distraction_count
    session.total_distracted_secs = body.total_distracted_secs

    existing_count = db.query(Planet).filter(Planet.user_id == user.id).count()
    planet = Planet(
        user_id=user.id,
        session_id=session.id,
        collection_index=existing_count,
        model_index=session.model_index,
    )
    db.add(planet)
    db.commit()
    db.refresh(planet)
    return SessionCompleteResponse(
        session_id=session.id,
        planet_id=planet.id,
        collection_index=planet.collection_index,
        model_index=planet.model_index,
    )


@router.post("/{session_id}/fail")
def fail_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = _get_owned_session(session_id, user.id, db)
    session.result = "failed"
    session.ended_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


@router.post("/{session_id}/abandon")
def abandon_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = _get_owned_session(session_id, user.id, db)
    if session.result is None:
        session.result = "abandoned"
        session.ended_at = datetime.utcnow()
        db.commit()
    return {"ok": True}


def _get_owned_session(session_id: str, user_id, db: Session) -> FocusSession:
    s = db.query(FocusSession).filter(
        FocusSession.id == session_id,
        FocusSession.user_id == user_id,
    ).first()
    if not s:
        raise HTTPException(404, "Session not found")
    return s
