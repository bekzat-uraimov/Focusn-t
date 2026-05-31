from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import User, Planet
from ..auth import get_current_user
from ..schemas import GalaxyResponse, PlanetResponse

router = APIRouter()


@router.get("/planets", response_model=GalaxyResponse)
def get_planets(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    planets = (
        db.query(Planet)
        .options(joinedload(Planet.session))
        .filter(Planet.user_id == user.id)
        .order_by(Planet.collection_index)
        .all()
    )
    return GalaxyResponse(
        planets=[PlanetResponse.model_validate(p) for p in planets],
        total_count=len(planets),
    )
