from typing import Optional
from fastapi import APIRouter, Request, UploadFile, File, Depends, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address
from openai import OpenAI
from app.core.config import settings
from app.core.security import get_current_user_id

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
_client: Optional[OpenAI] = None

# 25 MB — límite de Whisper
MAX_AUDIO_BYTES = 25 * 1024 * 1024

# Firmas de bytes conocidas para formatos de audio válidos
# Cada tupla es (offset, bytes_esperados)
_AUDIO_SIGNATURES = [
    (0, b"\x1a\x45\xdf\xa3"),   # WebM / MKV
    (0, b"OggS"),                # OGG
    (4, b"ftyp"),                # MP4 / M4A
    (0, b"RIFF"),                # WAV
    (0, b"ID3"),                 # MP3 con tag ID3
    (0, b"\xff\xfb"),            # MP3 sin tag
    (0, b"\xff\xf3"),            # MP3 sin tag (variante)
    (0, b"\xff\xf2"),            # MP3 sin tag (variante)
]

def _is_valid_audio(data: bytes) -> bool:
    for offset, signature in _AUDIO_SIGNATURES:
        end = offset + len(signature)
        if len(data) >= end and data[offset:end] == signature:
            return True
    return False

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
@limiter.limit("20/minute")
async def transcribe_audio(
    request: Request,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    # 1. Leer con límite de tamaño
    audio_bytes = await file.read(MAX_AUDIO_BYTES + 1)
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="El audio supera el límite de 25 MB")

    if len(audio_bytes) < 1000:
        raise HTTPException(status_code=400, detail="Audio demasiado corto")

    # 2. Validar que los bytes realmente son audio (no confiar en el header)
    if not _is_valid_audio(audio_bytes):
        raise HTTPException(status_code=400, detail="El archivo no es un audio válido")

    filename = file.filename or "audio.webm"
    content_type = file.content_type or "audio/webm"
    client = get_openai_client()

    try:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=(filename, audio_bytes, content_type),
            language="es",
        )
        corrected = correct_transcript(client, transcript.text)
        return {"text": corrected}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al transcribir. Inténtalo de nuevo.")
