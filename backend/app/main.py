from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from .config import settings
from .routers import auth, sessions, galaxy, rooms, analytics

app = FastAPI(title="focusn't API", version="1.0.0")


class COOPCOEPMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
        return response


app.add_middleware(COOPCOEPMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,      prefix="/auth",      tags=["auth"])
app.include_router(sessions.router,  prefix="/sessions",  tags=["sessions"])
app.include_router(galaxy.router,    prefix="/galaxy",    tags=["galaxy"])
app.include_router(rooms.router,     prefix="/rooms",     tags=["rooms"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])


@app.get("/health")
def health():
    return {"status": "ok"}
