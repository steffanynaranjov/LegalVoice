from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class FolderCreate(BaseModel):
    name: str
    client_name: Optional[str] = None
    color: str = "#4a6741"

class FolderResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    client_name: Optional[str] = None
    color: str
