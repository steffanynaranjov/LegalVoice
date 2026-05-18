from pydantic import BaseModel, Field
from typing import Optional, Any
from uuid import UUID
from datetime import datetime

class DocumentCreate(BaseModel):
    title: str = Field("Sin título", max_length=500)
    folder_id: Optional[UUID] = None
    content: dict[str, Any] = {}

class DocumentUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    folder_id: Optional[UUID] = None
    content: Optional[dict[str, Any]] = None
    word_count: Optional[int] = Field(None, ge=0, le=1_000_000)

class DocumentResponse(BaseModel):
    id: UUID
    user_id: UUID
    folder_id: Optional[UUID] = None
    title: str
    content: dict[str, Any]
    word_count: int
    updated_at: datetime
