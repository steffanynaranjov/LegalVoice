# legalvoice-backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import documents, folders, transcribe, translate, export

app = FastAPI(title="LegalVoice API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/api/v1/documents", tags=["documents"])
app.include_router(folders.router, prefix="/api/v1/folders", tags=["folders"])
app.include_router(transcribe.router, prefix="/api/v1/transcribe", tags=["transcribe"])
app.include_router(translate.router, prefix="/api/v1/translate", tags=["translate"])
app.include_router(export.router, prefix="/api/v1/export", tags=["export"])

@app.get("/health")
async def health():
    return {"status": "ok"}
