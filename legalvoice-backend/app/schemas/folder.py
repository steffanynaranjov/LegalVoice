from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID

class FolderCreate(BaseModel):
    name: str = Field(..., max_length=200)
    client_name: Optional[str] = Field(None, max_length=200)
    color: str = Field("#4a6741", pattern=r"^#[0-9a-fA-F]{6}$")

class FolderResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    client_name: Optional[str] = None
    color: str
