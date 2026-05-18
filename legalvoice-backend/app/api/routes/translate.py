import json
import re
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from app.api.routes.transcribe import get_openai_client
from app.core.security import get_current_user_id

router = APIRouter()

_SYSTEM_PROMPT = """You are a legal translator specializing in Spanish to English translation.

Your input is a JSON array of strings extracted from a legal document.
Your output must be a JSON array of the same length with each string translated to English.

Translation rules:
- Translate faithfully — do not add, remove, or summarize content
- Use internationally recognized legal equivalents:
  demandante → plaintiff | demandado → defendant | radicado → case number
  lucro cesante → loss of future earnings | daño emergente → actual damages
  perjuicios morales → non-pecuniary damages | llamamiento en garantía → third-party claim
  apoderado → attorney of record | poder → power of attorney | juzgado → court
  sentencia → judgment | recurso de apelación → appeal | audiencia → hearing
- Keep names of people, companies, and places as-is
- Keep dates, numbers, case references, and monetary amounts unchanged
- Maintain the same formality level as the source

Output format: return ONLY the JSON array, no markdown fences, no explanation."""


def extract_texts(node: dict) -> list[str]:
    texts = []
    if node.get("type") == "text" and node.get("text", "").strip():
        texts.append(node["text"])
    for child in node.get("content", []):
        texts.extend(extract_texts(child))
    return texts


def replace_texts(node: dict, translations: list[str], idx: list[int]) -> dict:
    result = {k: v for k, v in node.items() if k != "content"}
    if node.get("type") == "text" and node.get("text", "").strip():
        result["text"] = translations[idx[0]]
        idx[0] += 1
    if "content" in node:
        result["content"] = [replace_texts(child, translations, idx) for child in node["content"]]
    return result


def parse_array_response(raw: str) -> list[str]:
    raw = raw.strip()
    # Strip markdown fences if present
    raw = re.sub(r"^```[a-z]*\n?", "", raw)
    raw = re.sub(r"\n?```$", "", raw)
    raw = raw.strip()
    parsed = json.loads(raw)
    if isinstance(parsed, list):
        return parsed
    # GPT wrapped the array in an object
    if isinstance(parsed, dict):
        for v in parsed.values():
            if isinstance(v, list):
                return v
    raise ValueError(f"Unexpected response format: {type(parsed)}")


class TranslateRequest(BaseModel):
    title: str
    content: dict[str, Any]


class TranslateResponse(BaseModel):
    title: str
    content: dict[str, Any]


@router.post("/", response_model=TranslateResponse)
async def translate_document(
    body: TranslateRequest,
    user_id: str = Depends(get_current_user_id),
):
    texts = extract_texts(body.content)

    if not texts:
        raise HTTPException(status_code=400, detail="El documento no tiene contenido para traducir")

    client: OpenAI = get_openai_client()

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(texts, ensure_ascii=False)},
            ],
            temperature=0.1,
        )

        raw = response.choices[0].message.content or "[]"
        translations = parse_array_response(raw)

        if len(translations) != len(texts):
            raise HTTPException(
                status_code=500,
                detail=f"La traducción devolvió {len(translations)} fragmentos, se esperaban {len(texts)}"
            )

        translated_content = replace_texts(body.content, translations, [0])

        title_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Translate this Spanish legal document title to English. Return only the translated title, no punctuation, no quotes."},
                {"role": "user", "content": body.title},
            ],
            temperature=0,
            max_tokens=60,
        )
        translated_title = (title_response.choices[0].message.content or body.title).strip().strip('"\'')

        return TranslateResponse(
            title=f"{translated_title} (EN)",
            content=translated_content,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al traducir: {str(e)}")
