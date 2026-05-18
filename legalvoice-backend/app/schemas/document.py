from pydantic import BaseModel
from typing import Optional, Any
from uuid import UUID
from datetime import datetime

class DocumentCreate(BaseModel):
    title: str = "Sin título"
    folder_id: Optional[UUID] = None
    content: dict[str, Any] = {}

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    folder_id: Optional[UUID] = None
    content: Optional[dict[str, Any]] = None
    word_count: Optional[int] = None

class DocumentResponse(BaseModel):
    id: UUID
    user_id: UUID
    folder_id: Optional[UUID] = None
    title: str
    content: dict[str, Any]
    word_count: int
    updated_at: datetime
