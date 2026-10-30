from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import v1

app = FastAPI(title="Wind forecast error tool")
# Public, read-only data: allow any origin so the frontend can be hosted separately.
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET"])
app.include_router(v1.router)


@app.get("/health")
def health():
    return {"status": "ok"}
