from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import v1

app = FastAPI(title="Wind forecast error tool")
# Read-only API; the frontend is hosted separately, so its origin(s) come from GRID_CORS_ORIGINS.
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origin_list, allow_methods=["GET"])
app.include_router(v1.router)


@app.get("/health")
def health():
    return {"status": "ok"}
