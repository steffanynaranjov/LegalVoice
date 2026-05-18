# legalvoice-backend/app/api/routes/documents.py
from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user_id
from app.core.database import supabase
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentResponse
from uuid import UUID

router = APIRouter()

@router.get("/", response_model=list[DocumentResponse])
async def list_documents(user_id: str = Depends(get_current_user_id)):
    result = (
        supabase.table("documents")
        .select("*")
        .eq("user_id", user_id)
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .execute()
    )
    return result.data

@router.post("/", response_model=DocumentResponse, status_code=201)
async def create_document(body: DocumentCreate, user_id: str = Depends(get_current_user_id)):
    data = body.model_dump(exclude_none=True)
    data["user_id"] = user_id
    if "folder_id" in data and data["folder_id"]:
        data["folder_id"] = str(data["folder_id"])
    result = supabase.table("documents").insert(data).execute()
    return result.data[0]

@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(doc_id: UUID, user_id: str = Depends(get_current_user_id)):
    result = (
        supabase.table("documents")
        .select("*")
        .eq("id", str(doc_id))
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return result.data[0]

@router.put("/{doc_id}", response_model=DocumentResponse)
async def update_document(doc_id: UUID, body: DocumentUpdate, user_id: str = Depends(get_current_user_id)):
    data = body.model_dump(exclude_none=True)
    if "folder_id" in data and data["folder_id"]:
        data["folder_id"] = str(data["folder_id"])
    result = (
        supabase.table("documents")
        .update(data)
        .eq("id", str(doc_id))
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return result.data[0]

@router.delete("/{doc_id}", status_code=204)
async def delete_document(doc_id: UUID, user_id: str = Depends(get_current_user_id)):
    supabase.table("documents").delete().eq("id", str(doc_id)).eq("user_id", user_id).execute()
