from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import current_user
from app.db import get_db
from app.models.tree import Tree
from app.models.user import User
from app.schemas.user import TreeOut, UserProfile

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserProfile)
async def me(db: AsyncSession = Depends(get_db), user: User = Depends(current_user)):
    trees = await db.scalars(
        select(Tree).where(Tree.user_id == user.id, Tree.in_forest == True).order_by(Tree.created_at.desc())
    )
    profile = UserProfile.model_validate(user)
    profile.forest = [TreeOut.model_validate(t) for t in trees]
    return profile


@router.get("/me/trees", response_model=list[TreeOut])
async def my_trees(db: AsyncSession = Depends(get_db), user: User = Depends(current_user)):
    trees = await db.scalars(
        select(Tree).where(Tree.user_id == user.id, Tree.in_forest == True).order_by(Tree.created_at.desc())
    )
    return [TreeOut.model_validate(t) for t in trees]
