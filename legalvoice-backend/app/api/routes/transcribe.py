import os
import time
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from openai import OpenAI
from app.core.config import settings
from app.core.security import get_current_user_id

_AUDIO_DEBUG_DIR = Path("/tmp/lv_audio_debug")
_AUDIO_DEBUG_DIR.mkdir(exist_ok=True)

router = APIRouter()
_client: Optional[OpenAI] = None

_CORRECTION_PROMPT = """Eres un corrector de transcripciones de voz. Tu única tarea es corregir errores evidentes de transcripción automática.

Reglas estrictas:
- NO reescribas el texto ni cambies el sentido
- NO agregues palabras que no se dijeron
- NO cambies el estilo ni la formalidad
- Corrige SOLO errores claros de transcripción (palabras cortadas, homófonos mal transcritos, nombres obvios mal escritos)
- Conserva nombres propios, números, fechas, cuantías y términos jurídicos tal como están
- Si el texto está bien, devuélvelo igual
- Devuelve SOLO el texto corregido, sin explicaciones"""

def get_openai_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _client

def correct_transcript(client: OpenAI, text: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": _CORRECTION_PROMPT},
            {"role": "user", "content": text},
        ],
        temperature=0,
        max_tokens=len(text.split()) * 3,
    )
    corrected = response.choices[0].message.content or text
    return corrected.strip()

@router.post("/")
async def transcribe_audio(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser audio")

    audio_bytes = await file.read()

    if len(audio_bytes) < 1000:
        raise HTTPException(status_code=400, detail="Audio demasiado corto")

    filename = file.filename or "audio.webm"
    content_type = file.content_type or "audio/webm"

    # DEBUG: save audio to disk
    ext = filename.split(".")[-1]
    debug_path = _AUDIO_DEBUG_DIR / f"{int(time.time())}_{len(audio_bytes)}bytes.{ext}"
    debug_path.write_bytes(audio_bytes)
    print(f"[DEBUG] Audio guardado: {debug_path} | size={len(audio_bytes)} | content_type={content_type}")

    client = get_openai_client()

    try:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=(filename, audio_bytes, content_type),
            language="es",
        )
        raw_text = transcript.text
        print(f"[DEBUG] Whisper raw: {repr(raw_text)}")

        corrected = correct_transcript(client, raw_text)
        print(f"[DEBUG] Corrected:   {repr(corrected)}")
        return {"text": corrected}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al transcribir: {str(e)}")
