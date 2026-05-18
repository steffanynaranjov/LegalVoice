from fastapi import APIRouter, Depends
from app.core.security import get_current_user_id
from app.core.database import supabase
from app.schemas.folder import FolderCreate, FolderResponse
from uuid import UUID

router = APIRouter()

@router.get("/", response_model=list[FolderResponse])
async def list_folders(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("folders").select("*").eq("user_id", user_id).execute()
    return result.data

@router.post("/", response_model=FolderResponse, status_code=201)
async def create_folder(body: FolderCreate, user_id: str = Depends(get_current_user_id)):
    data = body.model_dump()
    data["user_id"] = user_id
    result = supabase.table("folders").insert(data).execute()
    return result.data[0]

@router.delete("/{folder_id}", status_code=204)
async def delete_folder(folder_id: UUID, user_id: str = Depends(get_current_user_id)):
    supabase.table("folders").delete().eq("id", str(folder_id)).eq("user_id", user_id).execute()
