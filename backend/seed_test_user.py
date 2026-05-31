"""
One-shot script: creates a demo user with 5 completed planets.
Run from the backend/ directory with the venv activated:
    python seed_test_user.py
"""
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext

from app.database import SessionLocal
from app.models import User, FocusSession, Planet

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

EMAIL    = "demo@focusnt.app"
USERNAME = "demo_user"
PASSWORD = "Demo1234!"

def main():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == EMAIL).first()
        if existing:
            print(f"User {EMAIL} already exists — skipping creation.")
            return

        user = User(
            id=uuid.uuid4(),
            email=EMAIL,
            username=USERNAME,
            password_hash=pwd_ctx.hash(PASSWORD),
            created_at=datetime.utcnow(),
        )
        db.add(user)
        db.flush()

        modes = ["coding", "writing", "coding", "writing", "coding"]
        for i in range(5):
            started = datetime.utcnow() - timedelta(days=5 - i, hours=2)
            ended   = started + timedelta(minutes=25)

            session = FocusSession(
                id=uuid.uuid4(),
                user_id=user.id,
                mode=modes[i],
                duration_seconds=1500,
                started_at=started,
                ended_at=ended,
                result="completed",
                avg_attention_score=round(0.75 + i * 0.04, 2),
                min_attention_score=round(0.55 + i * 0.02, 2),
                distraction_count=max(0, 3 - i),
                total_distracted_secs=max(0, (3 - i) * 15),
                model_index=i % 3,
            )
            db.add(session)
            db.flush()

            planet = Planet(
                id=uuid.uuid4(),
                user_id=user.id,
                session_id=session.id,
                collection_index=i,
                model_index=i % 3,
                created_at=ended,
            )
            db.add(planet)

        db.commit()
        print(f"Created user:  {EMAIL}")
        print(f"Password:      {PASSWORD}")
        print(f"Username:      {USERNAME}")
        print(f"Planets added: 5")

    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
