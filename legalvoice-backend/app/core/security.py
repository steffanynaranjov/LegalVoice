# legalvoice-backend/app/core/security.py
from fastapi import Header, HTTPException
from app.core.database import supabase

async def get_current_user_id(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido")
    token = authorization[7:]
    try:
        response = supabase.auth.get_user(token)
        return str(response.user.id)
    except Exception:
        raise HTTPException(status_code=401, detail="No autorizado")
