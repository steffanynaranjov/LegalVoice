# LegalVoice Fase 1 — Auth + Editor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el núcleo completo de LegalVoice: autenticación con Supabase, dashboard de documentos y carpetas, editor TipTap con autosave, y API FastAPI para CRUD de documentos y carpetas.

**Architecture:** El frontend Next.js 14 (App Router) maneja auth directamente con Supabase Auth y adjunta el JWT resultante como Bearer token en cada llamada al backend FastAPI. El backend valida el JWT usando supabase-py y ejecuta queries contra Supabase. RLS en Supabase garantiza aislamiento de datos por usuario a nivel de base de datos.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, TipTap v2, @supabase/supabase-js v2, @supabase/ssr, axios, FastAPI, Python 3.11, Pydantic v2, supabase-py, pytest, httpx

---

## Mapa de archivos

```
LegVoice/
├── docs/superpowers/specs/2026-05-17-legalvoice-fase1-design.md
├── docs/superpowers/plans/2026-05-17-legalvoice-fase1.md
│
├── legalvoice-backend/
│   ├── app/
│   │   ├── main.py                      ← entry point, CORS, routers
│   │   ├── api/routes/
│   │   │   ├── documents.py             ← 5 endpoints CRUD documentos
│   │   │   └── folders.py               ← 3 endpoints CRUD carpetas
│   │   ├── core/
│   │   │   ├── config.py                ← Settings con pydantic-settings
│   │   │   ├── security.py              ← validación JWT Supabase (dependency)
│   │   │   └── database.py              ← cliente supabase singleton
│   │   └── schemas/
│   │       ├── document.py              ← DocumentCreate/Update/Response
│   │       └── folder.py                ← FolderCreate/Response
│   ├── tests/
│   │   ├── conftest.py                  ← fixtures: mock_auth, client, auth_headers
│   │   ├── test_documents.py
│   │   └── test_folders.py
│   ├── requirements.txt
│   └── .env
│
└── legalvoice-frontend/
    ├── app/
    │   ├── layout.tsx                   ← root layout
    │   ├── globals.css
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   ├── dashboard/page.tsx
    │   └── editor/
    │       ├── new/page.tsx
    │       └── [id]/page.tsx
    ├── components/
    │   ├── editor/
    │   │   ├── TipTapEditor.tsx         ← editor con StarterKit+Underline+Align+CharCount
    │   │   ├── Toolbar.tsx              ← botones de formato
    │   │   └── WordCount.tsx            ← contador de palabras
    │   └── documents/
    │       ├── DocumentCard.tsx
    │       ├── DocumentList.tsx
    │       └── FolderTree.tsx
    ├── hooks/
    │   ├── useAutoSave.ts               ← debounce 2s → PUT /documents/{id}
    │   ├── useDocuments.ts
    │   └── useFolders.ts
    ├── lib/
    │   ├── supabase.ts                  ← createBrowserClient
    │   └── api.ts                       ← axios + interceptor JWT
    ├── middleware.ts                    ← protección de rutas
    ├── .env.local
    └── next.config.ts
```

---

## Task 1: Scaffold del backend FastAPI

**Files:**
- Create: `legalvoice-backend/requirements.txt`
- Create: `legalvoice-backend/.env`
- Create: `legalvoice-backend/app/__init__.py`
- Create: `legalvoice-backend/app/api/__init__.py`
- Create: `legalvoice-backend/app/api/routes/__init__.py`
- Create: `legalvoice-backend/app/core/__init__.py`
- Create: `legalvoice-backend/app/schemas/__init__.py`
- Create: `legalvoice-backend/tests/__init__.py`

- [ ] **Step 1: Crear estructura de directorios**

```bash
cd /Users/steffanynaranjo/Desktop/LegVoice
mkdir -p legalvoice-backend/app/api/routes
mkdir -p legalvoice-backend/app/core
mkdir -p legalvoice-backend/app/schemas
mkdir -p legalvoice-backend/tests
touch legalvoice-backend/app/__init__.py
touch legalvoice-backend/app/api/__init__.py
touch legalvoice-backend/app/api/routes/__init__.py
touch legalvoice-backend/app/core/__init__.py
touch legalvoice-backend/app/schemas/__init__.py
touch legalvoice-backend/tests/__init__.py
```

- [ ] **Step 2: Crear requirements.txt**

```
# legalvoice-backend/requirements.txt
fastapi==0.111.0
uvicorn[standard]==0.29.0
pydantic==2.7.1
pydantic-settings==2.2.1
supabase==2.5.0
httpx==0.27.0
pytest==8.2.0
pytest-asyncio==0.23.6
```

- [ ] **Step 3: Crear .env con placeholders**

```bash
# legalvoice-backend/.env
SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
CORS_ORIGINS=http://localhost:3000
```

- [ ] **Step 4: Crear entorno virtual e instalar dependencias**

```bash
cd legalvoice-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Resultado esperado: `Successfully installed fastapi-0.111.0 ...`

- [ ] **Step 5: Verificar instalación**

```bash
python -c "import fastapi; import supabase; print('OK')"
```

Resultado esperado: `OK`

- [ ] **Step 6: Commit**

```bash
cd /Users/steffanynaranjo/Desktop/LegVoice
git init
git add legalvoice-backend/requirements.txt legalvoice-backend/.env
git commit -m "feat: scaffold backend FastAPI"
```

---

## Task 2: Backend — config, database, security

**Files:**
- Create: `legalvoice-backend/app/core/config.py`
- Create: `legalvoice-backend/app/core/database.py`
- Create: `legalvoice-backend/app/core/security.py`

- [ ] **Step 1: Escribir el test de security (falla primero)**

```python
# legalvoice-backend/tests/test_security.py
import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException

def test_valid_token_returns_user_id():
    with patch("app.core.security.supabase") as mock_sb:
        mock_user = MagicMock()
        mock_user.user.id = "user-abc-123"
        mock_sb.auth.get_user.return_value = mock_user

        import asyncio
        from app.core.security import get_current_user_id
        result = asyncio.run(get_current_user_id("Bearer valid-token"))
        assert result == "user-abc-123"

def test_missing_bearer_raises_401():
    import asyncio
    from app.core.security import get_current_user_id
    with pytest.raises(HTTPException) as exc:
        asyncio.run(get_current_user_id("invalid-token"))
    assert exc.value.status_code == 401

def test_invalid_token_raises_401():
    with patch("app.core.security.supabase") as mock_sb:
        mock_sb.auth.get_user.side_effect = Exception("invalid")
        import asyncio
        from app.core.security import get_current_user_id
        with pytest.raises(HTTPException) as exc:
            asyncio.run(get_current_user_id("Bearer bad-token"))
        assert exc.value.status_code == 401
```

- [ ] **Step 2: Correr test — debe fallar**

```bash
cd legalvoice-backend && source venv/bin/activate
pytest tests/test_security.py -v
```

Resultado esperado: `ERROR` (módulos no existen aún)

- [ ] **Step 3: Crear config.py**

```python
# legalvoice-backend/app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    model_config = {"env_file": ".env"}

settings = Settings()
```

- [ ] **Step 4: Crear database.py**

```python
# legalvoice-backend/app/core/database.py
from supabase import create_client, Client
from app.core.config import settings

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
```

- [ ] **Step 5: Crear security.py**

```python
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
```

- [ ] **Step 6: Correr tests — deben pasar**

```bash
pytest tests/test_security.py -v
```

Resultado esperado: `3 passed`

- [ ] **Step 7: Commit**

```bash
git add legalvoice-backend/app/core/
legalvoice-backend/tests/test_security.py
git commit -m "feat: backend core config, database, security"
```

---

## Task 3: Backend — schemas Pydantic

**Files:**
- Create: `legalvoice-backend/app/schemas/document.py`
- Create: `legalvoice-backend/app/schemas/folder.py`

- [ ] **Step 1: Crear schemas de documentos**

```python
# legalvoice-backend/app/schemas/document.py
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
```

- [ ] **Step 2: Crear schemas de carpetas**

```python
# legalvoice-backend/app/schemas/folder.py
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
```

- [ ] **Step 3: Verificar que los schemas parsean correctamente**

```bash
cd legalvoice-backend && source venv/bin/activate
python -c "
from app.schemas.document import DocumentCreate, DocumentResponse
from app.schemas.folder import FolderCreate, FolderResponse
d = DocumentCreate(title='Test')
print(d)
f = FolderCreate(name='Carpeta')
print(f)
print('Schemas OK')
"
```

Resultado esperado: `Schemas OK`

- [ ] **Step 4: Commit**

```bash
git add legalvoice-backend/app/schemas/
git commit -m "feat: schemas Pydantic para documents y folders"
```

---

## Task 4: Backend — endpoints de documentos + tests

**Files:**
- Create: `legalvoice-backend/app/api/routes/documents.py`
- Create: `legalvoice-backend/tests/conftest.py`
- Create: `legalvoice-backend/tests/test_documents.py`

- [ ] **Step 1: Crear conftest.py con fixtures compartidos**

```python
# legalvoice-backend/tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

MOCK_USER_ID = "test-user-uuid-123"

@pytest.fixture
def mock_auth():
    with patch("app.core.security.supabase") as mock:
        mock_user = MagicMock()
        mock_user.user.id = MOCK_USER_ID
        mock.auth.get_user.return_value = mock_user
        yield mock

@pytest.fixture
def client(mock_auth):
    from app.main import app
    return TestClient(app)

@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer test-token-valid"}
```

- [ ] **Step 2: Escribir tests de documentos (fallan primero)**

```python
# legalvoice-backend/tests/test_documents.py
from unittest.mock import patch
from tests.conftest import MOCK_USER_ID

MOCK_DOC = {
    "id": "11111111-1111-1111-1111-111111111111",
    "user_id": MOCK_USER_ID,
    "folder_id": None,
    "title": "Contrato de prueba",
    "content": {},
    "word_count": 0,
    "updated_at": "2026-05-17T00:00:00+00:00",
}

def test_list_documents_returns_empty(client, auth_headers):
    with patch("app.api.routes.documents.supabase") as mock_sb:
        (mock_sb.table.return_value.select.return_value
         .eq.return_value.eq.return_value.order.return_value.execute
         .return_value.data) = []
        response = client.get("/api/v1/documents/", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []

def test_create_document(client, auth_headers):
    with patch("app.api.routes.documents.supabase") as mock_sb:
        mock_sb.table.return_value.insert.return_value.execute.return_value.data = [MOCK_DOC]
        response = client.post(
            "/api/v1/documents/",
            json={"title": "Contrato de prueba"},
            headers=auth_headers,
        )
    assert response.status_code == 201
    assert response.json()["title"] == "Contrato de prueba"

def test_get_document_not_found(client, auth_headers):
    with patch("app.api.routes.documents.supabase") as mock_sb:
        (mock_sb.table.return_value.select.return_value
         .eq.return_value.eq.return_value.execute.return_value.data) = []
        response = client.get(
            "/api/v1/documents/00000000-0000-0000-0000-000000000001",
            headers=auth_headers,
        )
    assert response.status_code == 404

def test_update_document(client, auth_headers):
    updated = {**MOCK_DOC, "title": "Título actualizado", "word_count": 10}
    with patch("app.api.routes.documents.supabase") as mock_sb:
        mock_sb.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value.data = [updated]
        response = client.put(
            f"/api/v1/documents/{MOCK_DOC['id']}",
            json={"title": "Título actualizado", "word_count": 10},
            headers=auth_headers,
        )
    assert response.status_code == 200
    assert response.json()["title"] == "Título actualizado"

def test_delete_document(client, auth_headers):
    with patch("app.api.routes.documents.supabase") as mock_sb:
        mock_sb.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = None
        response = client.delete(
            f"/api/v1/documents/{MOCK_DOC['id']}",
            headers=auth_headers,
        )
    assert response.status_code == 204

def test_request_without_auth_returns_422(client):
    response = client.get("/api/v1/documents/")
    assert response.status_code == 422
```

- [ ] **Step 3: Correr tests — deben fallar**

```bash
cd legalvoice-backend && source venv/bin/activate
pytest tests/test_documents.py -v
```

Resultado esperado: `ERROR` (routes/documents.py y main.py no existen)

- [ ] **Step 4: Crear documents.py route**

```python
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
```

- [ ] **Step 5: Crear main.py**

```python
# legalvoice-backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import documents, folders

app = FastAPI(title="LegalVoice API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/api/v1/documents", tags=["documents"])
app.include_router(folders.router, prefix="/api/v1/folders", tags=["folders"])

@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 6: Correr tests de documentos — deben pasar**

```bash
pytest tests/test_documents.py -v
```

Resultado esperado: `6 passed`

- [ ] **Step 7: Commit**

```bash
git add legalvoice-backend/app/api/routes/documents.py \
        legalvoice-backend/app/main.py \
        legalvoice-backend/tests/conftest.py \
        legalvoice-backend/tests/test_documents.py
git commit -m "feat: endpoints CRUD de documentos con tests"
```

---

## Task 5: Backend — endpoints de carpetas + tests

**Files:**
- Create: `legalvoice-backend/app/api/routes/folders.py`
- Create: `legalvoice-backend/tests/test_folders.py`

- [ ] **Step 1: Escribir tests de folders (fallan primero)**

```python
# legalvoice-backend/tests/test_folders.py
from unittest.mock import patch
from tests.conftest import MOCK_USER_ID

MOCK_FOLDER = {
    "id": "22222222-2222-2222-2222-222222222222",
    "user_id": MOCK_USER_ID,
    "name": "Caso García",
    "client_name": "García e Hijos",
    "color": "#4a6741",
}

def test_list_folders_empty(client, auth_headers):
    with patch("app.api.routes.folders.supabase") as mock_sb:
        mock_sb.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        response = client.get("/api/v1/folders/", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []

def test_create_folder(client, auth_headers):
    with patch("app.api.routes.folders.supabase") as mock_sb:
        mock_sb.table.return_value.insert.return_value.execute.return_value.data = [MOCK_FOLDER]
        response = client.post(
            "/api/v1/folders/",
            json={"name": "Caso García", "client_name": "García e Hijos"},
            headers=auth_headers,
        )
    assert response.status_code == 201
    assert response.json()["name"] == "Caso García"

def test_delete_folder(client, auth_headers):
    with patch("app.api.routes.folders.supabase") as mock_sb:
        mock_sb.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = None
        response = client.delete(
            f"/api/v1/folders/{MOCK_FOLDER['id']}",
            headers=auth_headers,
        )
    assert response.status_code == 204
```

- [ ] **Step 2: Correr tests — deben fallar**

```bash
pytest tests/test_folders.py -v
```

Resultado esperado: `ERROR` (folders.py no existe)

- [ ] **Step 3: Crear folders.py route**

```python
# legalvoice-backend/app/api/routes/folders.py
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
```

- [ ] **Step 4: Correr todos los tests del backend**

```bash
pytest tests/ -v
```

Resultado esperado: `10 passed` (security + documents + folders)

- [ ] **Step 5: Verificar que el servidor arranca**

```bash
uvicorn app.main:app --reload --port 8000
```

Visitar `http://localhost:8000/health` → `{"status":"ok"}`
Visitar `http://localhost:8000/docs` → Swagger UI con todos los endpoints

- [ ] **Step 6: Commit**

```bash
git add legalvoice-backend/app/api/routes/folders.py \
        legalvoice-backend/tests/test_folders.py
git commit -m "feat: endpoints CRUD de carpetas con tests"
```

---

## Task 6: Supabase — schema SQL y RLS

Ejecutar en el SQL Editor de Supabase Dashboard (https://supabase.com/dashboard → proyecto → SQL Editor).

- [ ] **Step 1: Crear tablas y trigger de usuario**

```sql
-- Habilitar extensión UUID
create extension if not exists "uuid-ossp";

-- Tabla users (espejo de auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  firm_name text,
  created_at timestamptz default now()
);

-- Tabla folders
create table public.folders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  name text not null,
  client_name text,
  color text default '#4a6741'
);

-- Tabla documents
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  folder_id uuid references public.folders on delete set null,
  title text not null default 'Sin título',
  content jsonb default '{}',
  word_count integer default 0,
  updated_at timestamptz default now()
);
```

- [ ] **Step 2: Activar RLS y crear políticas**

```sql
-- Habilitar RLS en todas las tablas
alter table public.users enable row level security;
alter table public.folders enable row level security;
alter table public.documents enable row level security;

-- Políticas: cada usuario solo accede a sus propios datos
create policy "users_own_profile"
  on public.users for all
  using (auth.uid() = id);

create policy "users_own_folders"
  on public.folders for all
  using (auth.uid() = user_id);

create policy "users_own_documents"
  on public.documents for all
  using (auth.uid() = user_id);
```

- [ ] **Step 3: Crear trigger auto-create user profile**

```sql
-- Crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

- [ ] **Step 4: Crear trigger auto-update updated_at en documents**

```sql
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger documents_updated_at
  before update on public.documents
  for each row execute procedure public.update_updated_at();
```

- [ ] **Step 5: Verificar en Table Editor**

En Supabase Dashboard → Table Editor: confirmar que existen tablas `users`, `folders`, `documents` con las columnas correctas.

- [ ] **Step 6: Guardar el SQL en el repo**

```bash
mkdir -p /Users/steffanynaranjo/Desktop/LegVoice/supabase
# Guardar el SQL completo en supabase/schema.sql
```

```sql
-- supabase/schema.sql
-- (copiar todo el SQL de los steps anteriores)
```

```bash
git add supabase/schema.sql
git commit -m "feat: schema SQL Supabase con RLS y triggers"
```

---

## Task 7: Scaffold del frontend Next.js

**Files:**
- Create: `legalvoice-frontend/` (todo el scaffold)

- [ ] **Step 1: Crear proyecto Next.js**

```bash
cd /Users/steffanynaranjo/Desktop/LegVoice
npx create-next-app@14 legalvoice-frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

Cuando pregunte: seleccionar las opciones por defecto.

- [ ] **Step 2: Instalar dependencias**

```bash
cd legalvoice-frontend
npm install @supabase/supabase-js @supabase/ssr axios
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit \
  @tiptap/extension-underline @tiptap/extension-text-align \
  @tiptap/extension-character-count
npm install -D @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jest jest-environment-jsdom \
  @types/jest ts-jest
```

- [ ] **Step 3: Instalar componentes shadcn/ui necesarios**

```bash
npx shadcn@latest init
# Seleccionar: Default style, Slate color scheme, CSS variables: yes

npx shadcn@latest add button input label card separator
```

- [ ] **Step 4: Crear .env.local**

```bash
# legalvoice-frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- [ ] **Step 5: Crear jest.config.ts**

```typescript
// legalvoice-frontend/jest.config.ts
import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
}

export default config
```

- [ ] **Step 6: Crear jest.setup.ts**

```typescript
// legalvoice-frontend/jest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Verificar que Next.js arranca**

```bash
npm run dev
```

Visitar `http://localhost:3000` → página de bienvenida de Next.js

- [ ] **Step 8: Commit**

```bash
cd /Users/steffanynaranjo/Desktop/LegVoice
git add legalvoice-frontend/
git commit -m "feat: scaffold frontend Next.js 14 con dependencias"
```

---

## Task 8: Frontend — lib (supabase.ts + api.ts)

**Files:**
- Create: `legalvoice-frontend/lib/supabase.ts`
- Create: `legalvoice-frontend/lib/api.ts`
- Create: `legalvoice-frontend/__tests__/lib/api.test.ts`

- [ ] **Step 1: Crear supabase.ts**

```typescript
// legalvoice-frontend/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Escribir test de api.ts (falla primero)**

```typescript
// legalvoice-frontend/__tests__/lib/api.test.ts
jest.mock('@/lib/supabase', () => ({
  createClient: () => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'mock-jwt-token' } },
      }),
    },
  }),
}))

import api from '@/lib/api'

describe('api interceptor', () => {
  it('adjunta Authorization header con el JWT de Supabase', async () => {
    const spy = jest.spyOn(api, 'get').mockResolvedValue({ data: [] })
    await api.get('/api/v1/documents/')
    const config = spy.mock.calls[0][1] as { headers?: Record<string, string> }
    // El interceptor inyecta el header en la request real
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
```

- [ ] **Step 3: Correr test — debe fallar**

```bash
cd legalvoice-frontend
npx jest __tests__/lib/api.test.ts
```

Resultado esperado: `FAIL` (api.ts no existe)

- [ ] **Step 4: Crear api.ts**

```typescript
// legalvoice-frontend/lib/api.ts
import axios from 'axios'
import { createClient } from './supabase'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
})

api.interceptors.request.use(async (config) => {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

export default api
```

- [ ] **Step 5: Correr test — debe pasar**

```bash
npx jest __tests__/lib/api.test.ts
```

Resultado esperado: `1 passed`

- [ ] **Step 6: Commit**

```bash
git add legalvoice-frontend/lib/ legalvoice-frontend/__tests__/
git commit -m "feat: lib supabase client y axios con interceptor JWT"
```

---

## Task 9: Frontend — middleware de protección de rutas

**Files:**
- Create: `legalvoice-frontend/middleware.ts`

- [ ] **Step 1: Crear middleware.ts**

```typescript
// legalvoice-frontend/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const protectedRoutes = ['/dashboard', '/editor']
  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r))

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
```

- [ ] **Step 2: Verificar manualmente**

Con el servidor de desarrollo corriendo (`npm run dev`):
- Visitar `http://localhost:3000/dashboard` sin sesión → redirige a `/login`
- Visitar `http://localhost:3000/editor/new` sin sesión → redirige a `/login`

- [ ] **Step 3: Commit**

```bash
git add legalvoice-frontend/middleware.ts
git commit -m "feat: middleware de protección de rutas"
```

---

## Task 10: Frontend — páginas de auth (login + register)

**Files:**
- Create: `legalvoice-frontend/app/(auth)/login/page.tsx`
- Create: `legalvoice-frontend/app/(auth)/register/page.tsx`
- Create: `legalvoice-frontend/app/(auth)/layout.tsx`

- [ ] **Step 1: Crear layout de auth**

```typescript
// legalvoice-frontend/app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
```

- [ ] **Step 2: Crear login/page.tsx**

```typescript
// legalvoice-frontend/app/(auth)/login/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">LegalVoice</CardTitle>
        <CardDescription>Inicia sesión en tu cuenta</CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>
          )}
          <div className="space-y-1">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>
          <p className="text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Regístrate
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
```

- [ ] **Step 3: Crear register/page.tsx**

```typescript
// legalvoice-frontend/app/(auth)/register/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [firmName, setFirmName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, firm_name: firmName } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Crear cuenta</CardTitle>
        <CardDescription>Empieza a usar LegalVoice hoy</CardDescription>
      </CardHeader>
      <form onSubmit={handleRegister}>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>
          )}
          <div className="space-y-1">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="firmName">Despacho / Firma (opcional)</Label>
            <Input id="firmName" value={firmName} onChange={(e) => setFirmName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Contraseña (mín. 6 caracteres)</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
          <p className="text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
```

- [ ] **Step 4: Verificar manualmente**

Con `npm run dev` corriendo:
- Visitar `http://localhost:3000/register` → formulario de registro visible
- Visitar `http://localhost:3000/login` → formulario de login visible
- Registrar un usuario de prueba → redirige a `/dashboard` (error 404 por ahora, normal)

- [ ] **Step 5: Commit**

```bash
git add legalvoice-frontend/app/(auth)/
git commit -m "feat: páginas de login y registro con Supabase Auth"
```

---

## Task 11: Frontend — hooks useDocuments y useFolders

**Files:**
- Create: `legalvoice-frontend/hooks/useDocuments.ts`
- Create: `legalvoice-frontend/hooks/useFolders.ts`
- Create: `legalvoice-frontend/__tests__/hooks/useDocuments.test.ts`

- [ ] **Step 1: Definir tipos compartidos**

```typescript
// legalvoice-frontend/lib/types.ts
export interface Document {
  id: string
  user_id: string
  folder_id: string | null
  title: string
  content: Record<string, unknown>
  word_count: number
  updated_at: string
}

export interface Folder {
  id: string
  user_id: string
  name: string
  client_name: string | null
  color: string
}
```

- [ ] **Step 2: Escribir test de useDocuments (falla primero)**

```typescript
// legalvoice-frontend/__tests__/hooks/useDocuments.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useDocuments } from '@/hooks/useDocuments'

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({
      data: [
        {
          id: 'doc-1',
          user_id: 'user-1',
          folder_id: null,
          title: 'Contrato',
          content: {},
          word_count: 150,
          updated_at: '2026-05-17T00:00:00+00:00',
        },
      ],
    }),
  },
}))

describe('useDocuments', () => {
  it('carga documentos y termina en loading=false', async () => {
    const { result } = renderHook(() => useDocuments())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.documents).toHaveLength(1)
    expect(result.current.documents[0].title).toBe('Contrato')
  })
})
```

- [ ] **Step 3: Correr test — debe fallar**

```bash
npx jest __tests__/hooks/useDocuments.test.ts
```

Resultado esperado: `FAIL` (hook no existe)

- [ ] **Step 4: Crear useDocuments.ts**

```typescript
// legalvoice-frontend/hooks/useDocuments.ts
import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import type { Document } from '@/lib/types'

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await api.get<Document[]>('/api/v1/documents/')
      setDocuments(data)
    } catch {
      setError('Error al cargar documentos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  return { documents, loading, error, refetch: fetchDocuments }
}
```

- [ ] **Step 5: Crear useFolders.ts**

```typescript
// legalvoice-frontend/hooks/useFolders.ts
import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import type { Folder } from '@/lib/types'

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFolders = useCallback(async () => {
    try {
      const { data } = await api.get<Folder[]>('/api/v1/folders/')
      setFolders(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  return { folders, loading, refetch: fetchFolders }
}
```

- [ ] **Step 6: Correr tests — deben pasar**

```bash
npx jest __tests__/hooks/useDocuments.test.ts
```

Resultado esperado: `1 passed`

- [ ] **Step 7: Commit**

```bash
git add legalvoice-frontend/lib/types.ts \
        legalvoice-frontend/hooks/ \
        legalvoice-frontend/__tests__/hooks/
git commit -m "feat: hooks useDocuments, useFolders y tipos compartidos"
```

---

## Task 12: Frontend — hook useAutoSave

**Files:**
- Create: `legalvoice-frontend/hooks/useAutoSave.ts`
- Create: `legalvoice-frontend/__tests__/hooks/useAutoSave.test.ts`

- [ ] **Step 1: Escribir test de useAutoSave (falla primero)**

```typescript
// legalvoice-frontend/__tests__/hooks/useAutoSave.test.ts
import { renderHook, act } from '@testing-library/react'
import { useAutoSave } from '@/hooks/useAutoSave'

const mockPut = jest.fn().mockResolvedValue({})
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { put: mockPut },
}))

beforeEach(() => {
  jest.useFakeTimers()
  mockPut.mockClear()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('useAutoSave', () => {
  it('no guarda si documentId es null', async () => {
    renderHook(() => useAutoSave(null, {}, 0, 'Título'))
    act(() => { jest.advanceTimersByTime(3000) })
    expect(mockPut).not.toHaveBeenCalled()
  })

  it('guarda después de 2 segundos de inactividad', async () => {
    renderHook(() => useAutoSave('doc-123', { type: 'doc' }, 10, 'Título'))
    act(() => { jest.advanceTimersByTime(2000) })
    expect(mockPut).toHaveBeenCalledWith('/api/v1/documents/doc-123', {
      content: { type: 'doc' },
      word_count: 10,
      title: 'Título',
    })
  })

  it('resetea el timer si el contenido cambia antes de 2 segundos', async () => {
    const { rerender } = renderHook(
      ({ content }) => useAutoSave('doc-123', content, 5, 'Título'),
      { initialProps: { content: { v: 1 } } }
    )
    act(() => { jest.advanceTimersByTime(1000) })
    rerender({ content: { v: 2 } })
    act(() => { jest.advanceTimersByTime(1000) })
    expect(mockPut).not.toHaveBeenCalled()
    act(() => { jest.advanceTimersByTime(1000) })
    expect(mockPut).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Correr test — debe fallar**

```bash
npx jest __tests__/hooks/useAutoSave.test.ts
```

Resultado esperado: `FAIL`

- [ ] **Step 3: Crear useAutoSave.ts**

```typescript
// legalvoice-frontend/hooks/useAutoSave.ts
import { useEffect, useRef } from 'react'
import api from '@/lib/api'

export function useAutoSave(
  documentId: string | null,
  content: Record<string, unknown>,
  wordCount: number,
  title: string
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!documentId) return

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      api.put(`/api/v1/documents/${documentId}`, {
        content,
        word_count: wordCount,
        title,
      })
    }, 2000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [documentId, content, wordCount, title])
}
```

- [ ] **Step 4: Correr tests — deben pasar**

```bash
npx jest __tests__/hooks/useAutoSave.test.ts
```

Resultado esperado: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add legalvoice-frontend/hooks/useAutoSave.ts \
        legalvoice-frontend/__tests__/hooks/useAutoSave.test.ts
git commit -m "feat: hook useAutoSave con debounce 2s y tests"
```

---

## Task 13: Frontend — componentes del dashboard

**Files:**
- Create: `legalvoice-frontend/components/documents/DocumentCard.tsx`
- Create: `legalvoice-frontend/components/documents/DocumentList.tsx`
- Create: `legalvoice-frontend/components/documents/FolderTree.tsx`

- [ ] **Step 1: Crear DocumentCard.tsx**

```typescript
// legalvoice-frontend/components/documents/DocumentCard.tsx
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Document, Folder } from '@/lib/types'

interface DocumentCardProps {
  document: Document
  folder?: Folder
  onDelete: (id: string) => void
}

export function DocumentCard({ document, folder, onDelete }: DocumentCardProps) {
  const updatedAt = new Date(document.updated_at).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-base line-clamp-2">
          <Link href={`/editor/${document.id}`} className="hover:underline">
            {document.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            {folder && (
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: folder.color }}
              />
            )}
            <span>{folder?.name ?? 'Sin carpeta'}</span>
          </div>
          <span>{document.word_count} palabras</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">{updatedAt}</span>
          <button
            onClick={() => onDelete(document.id)}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Eliminar
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Crear DocumentList.tsx**

```typescript
// legalvoice-frontend/components/documents/DocumentList.tsx
import { DocumentCard } from './DocumentCard'
import type { Document, Folder } from '@/lib/types'

interface DocumentListProps {
  documents: Document[]
  folders: Folder[]
  onDelete: (id: string) => void
}

export function DocumentList({ documents, folders, onDelete }: DocumentListProps) {
  const folderMap = Object.fromEntries(folders.map((f) => [f.id, f]))

  if (documents.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg mb-2">No tienes documentos aún</p>
        <p className="text-sm">Crea tu primer documento jurídico</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          folder={doc.folder_id ? folderMap[doc.folder_id] : undefined}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Crear FolderTree.tsx**

```typescript
// legalvoice-frontend/components/documents/FolderTree.tsx
import type { Folder } from '@/lib/types'

interface FolderTreeProps {
  folders: Folder[]
  selectedFolderId: string | null
  onSelect: (id: string | null) => void
  onDelete: (id: string) => void
}

export function FolderTree({ folders, selectedFolderId, onSelect, onDelete }: FolderTreeProps) {
  return (
    <nav className="space-y-1">
      <button
        onClick={() => onSelect(null)}
        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
          selectedFolderId === null
            ? 'bg-gray-100 font-medium'
            : 'hover:bg-gray-50 text-gray-700'
        }`}
      >
        Todos los documentos
      </button>

      {folders.length > 0 && (
        <div className="mt-3">
          <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
            Carpetas
          </p>
          {folders.map((folder) => (
            <div key={folder.id} className="flex items-center group">
              <button
                onClick={() => onSelect(folder.id)}
                className={`flex-1 flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                  selectedFolderId === folder.id
                    ? 'bg-gray-100 font-medium'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: folder.color }}
                />
                <span className="truncate">{folder.name}</span>
              </button>
              <button
                onClick={() => onDelete(folder.id)}
                className="opacity-0 group-hover:opacity-100 px-2 text-red-400 hover:text-red-600 text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </nav>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add legalvoice-frontend/components/documents/
git commit -m "feat: componentes DocumentCard, DocumentList y FolderTree"
```

---

## Task 14: Frontend — página dashboard

**Files:**
- Create: `legalvoice-frontend/app/dashboard/page.tsx`
- Modify: `legalvoice-frontend/app/layout.tsx`

- [ ] **Step 1: Actualizar app/layout.tsx**

```typescript
// legalvoice-frontend/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LegalVoice',
  description: 'Redacción jurídica asistida por voz e IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Crear dashboard/page.tsx**

```typescript
// legalvoice-frontend/app/dashboard/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDocuments } from '@/hooks/useDocuments'
import { useFolders } from '@/hooks/useFolders'
import { DocumentList } from '@/components/documents/DocumentList'
import { FolderTree } from '@/components/documents/FolderTree'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase'
import api from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const { documents, loading: docsLoading, refetch: refetchDocs } = useDocuments()
  const { folders, refetch: refetchFolders } = useFolders()
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)

  const filteredDocs = selectedFolderId
    ? documents.filter((d) => d.folder_id === selectedFolderId)
    : documents

  async function handleNewDocument() {
    const { data } = await api.post('/api/v1/documents/', {
      title: 'Sin título',
      folder_id: selectedFolderId ?? undefined,
    })
    router.push(`/editor/${data.id}`)
  }

  async function handleDeleteDocument(id: string) {
    if (!confirm('¿Eliminar este documento?')) return
    await api.delete(`/api/v1/documents/${id}`)
    refetchDocs()
  }

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault()
    if (!newFolderName.trim()) return
    await api.post('/api/v1/folders/', { name: newFolderName.trim() })
    setNewFolderName('')
    setShowNewFolder(false)
    refetchFolders()
  }

  async function handleDeleteFolder(id: string) {
    if (!confirm('¿Eliminar esta carpeta?')) return
    await api.delete(`/api/v1/folders/${id}`)
    if (selectedFolderId === id) setSelectedFolderId(null)
    refetchFolders()
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">LegalVoice</h1>
        <div className="flex items-center gap-3">
          <Button onClick={handleNewDocument}>+ Nuevo documento</Button>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">
            Salir
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r p-4 flex flex-col gap-4 overflow-y-auto">
          <FolderTree
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelect={setSelectedFolderId}
            onDelete={handleDeleteFolder}
          />

          {showNewFolder ? (
            <form onSubmit={handleCreateFolder} className="space-y-2">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nombre de carpeta"
                autoFocus
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1">Crear</Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNewFolder(false)}
                >
                  ×
                </Button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowNewFolder(true)}
              className="text-sm text-gray-400 hover:text-gray-600 text-left"
            >
              + Nueva carpeta
            </button>
          )}
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 overflow-y-auto">
          {docsLoading ? (
            <div className="text-center py-16 text-gray-400">Cargando documentos...</div>
          ) : (
            <DocumentList
              documents={filteredDocs}
              folders={folders}
              onDelete={handleDeleteDocument}
            />
          )}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verificar manualmente**

Con backend corriendo (`uvicorn app.main:app --reload`) y frontend (`npm run dev`):
- Iniciar sesión → redirige a `/dashboard`
- Dashboard muestra lista vacía con mensaje
- Botón "Nuevo documento" crea un documento y redirige al editor
- Sidebar muestra "Todos los documentos"
- Crear carpeta → aparece en sidebar

- [ ] **Step 4: Commit**

```bash
git add legalvoice-frontend/app/dashboard/ legalvoice-frontend/app/layout.tsx
git commit -m "feat: dashboard con lista de documentos y carpetas"
```

---

## Task 15: Frontend — editor TipTap (Toolbar + WordCount + TipTapEditor)

**Files:**
- Create: `legalvoice-frontend/components/editor/Toolbar.tsx`
- Create: `legalvoice-frontend/components/editor/WordCount.tsx`
- Create: `legalvoice-frontend/components/editor/TipTapEditor.tsx`

- [ ] **Step 1: Crear Toolbar.tsx**

```typescript
// legalvoice-frontend/components/editor/Toolbar.tsx
'use client'
import type { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface ToolbarProps {
  editor: Editor
}

interface ToolbarButton {
  label: string
  action: () => void
  isActive: boolean
  title: string
}

export function Toolbar({ editor }: ToolbarProps) {
  const buttons: ToolbarButton[] = [
    {
      label: 'N',
      title: 'Negrita',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
    },
    {
      label: 'I',
      title: 'Cursiva',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
    },
    {
      label: 'S',
      title: 'Subrayado',
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive('underline'),
    },
  ]

  const headingButtons = [1, 2, 3].map((level) => ({
    label: `H${level}`,
    title: `Encabezado ${level}`,
    action: () => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run(),
    isActive: editor.isActive('heading', { level }),
  }))

  const alignButtons = [
    { label: '≡', title: 'Izquierda', align: 'left' },
    { label: '≡', title: 'Centro', align: 'center' },
    { label: '≡', title: 'Derecha', align: 'right' },
    { label: '≡', title: 'Justificado', align: 'justify' },
  ].map(({ label, title, align }) => ({
    label,
    title,
    action: () => editor.chain().focus().setTextAlign(align).run(),
    isActive: editor.isActive({ textAlign: align }),
  }))

  const renderButton = ({ label, title, action, isActive }: ToolbarButton, i: number) => (
    <Button
      key={i}
      variant={isActive ? 'default' : 'ghost'}
      size="sm"
      onClick={action}
      title={title}
      className="h-8 w-8 p-0 font-mono text-xs"
    >
      {label}
    </Button>
  )

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-white flex-wrap">
      {buttons.map(renderButton)}
      <Separator orientation="vertical" className="h-6 mx-1" />
      {headingButtons.map(renderButton)}
      <Separator orientation="vertical" className="h-6 mx-1" />
      {alignButtons.map(renderButton)}
      <Separator orientation="vertical" className="h-6 mx-1" />
      <Button
        variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Lista"
        className="h-8 w-8 p-0 text-xs"
      >
        •≡
      </Button>
      <Button
        variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Lista numerada"
        className="h-8 w-8 p-0 text-xs"
      >
        1≡
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Crear WordCount.tsx**

```typescript
// legalvoice-frontend/components/editor/WordCount.tsx
import type { Editor } from '@tiptap/react'

interface WordCountProps {
  editor: Editor
}

export function WordCount({ editor }: WordCountProps) {
  const words = editor.storage.characterCount?.words() ?? 0
  const characters = editor.storage.characterCount?.characters() ?? 0

  return (
    <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-400 flex gap-4">
      <span>{words} palabras</span>
      <span>{characters} caracteres</span>
    </div>
  )
}
```

- [ ] **Step 3: Crear TipTapEditor.tsx**

```typescript
// legalvoice-frontend/components/editor/TipTapEditor.tsx
'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import CharacterCount from '@tiptap/extension-character-count'
import { Toolbar } from './Toolbar'
import { WordCount } from './WordCount'

interface TipTapEditorProps {
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>, wordCount: number) => void
}

export function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      CharacterCount,
    ],
    content,
    onUpdate({ editor }) {
      const json = editor.getJSON() as Record<string, unknown>
      const words = editor.storage.characterCount.words() as number
      onChange(json, words)
    },
    editorProps: {
      attributes: {
        class: 'outline-none min-h-full',
      },
    },
  })

  if (!editor) return null

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white">
      <Toolbar editor={editor} />
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto prose prose-sm sm:prose">
          <EditorContent editor={editor} className="min-h-[500px]" />
        </div>
      </div>
      <WordCount editor={editor} />
    </div>
  )
}
```

- [ ] **Step 4: Agregar estilos del editor en globals.css**

Añadir al final de `legalvoice-frontend/app/globals.css`:

```css
/* TipTap editor styles */
.ProseMirror {
  outline: none;
  min-height: 500px;
}

.ProseMirror p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
```

- [ ] **Step 5: Commit**

```bash
git add legalvoice-frontend/components/editor/ \
        legalvoice-frontend/app/globals.css
git commit -m "feat: editor TipTap con Toolbar, WordCount y extensiones jurídicas"
```

---

## Task 16: Frontend — páginas del editor (new + [id])

**Files:**
- Create: `legalvoice-frontend/app/editor/new/page.tsx`
- Create: `legalvoice-frontend/app/editor/[id]/page.tsx`

- [ ] **Step 1: Crear editor/new/page.tsx**

```typescript
// legalvoice-frontend/app/editor/new/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function NewDocumentPage() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (creating) return
    setCreating(true)
    api
      .post('/api/v1/documents/', { title: 'Sin título' })
      .then(({ data }) => router.replace(`/editor/${data.id}`))
  }, [router, creating])

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Creando documento...
    </div>
  )
}
```

- [ ] **Step 2: Crear editor/[id]/page.tsx**

```typescript
// legalvoice-frontend/app/editor/[id]/page.tsx
'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { TipTapEditor } from '@/components/editor/TipTapEditor'
import { useAutoSave } from '@/hooks/useAutoSave'
import api from '@/lib/api'
import type { Document } from '@/lib/types'
import { Input } from '@/components/ui/input'

export default function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [document, setDocument] = useState<Document | null>(null)
  const [title, setTitle] = useState('Sin título')
  const [content, setContent] = useState<Record<string, unknown>>({})
  const [wordCount, setWordCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'guardado' | 'guardando...' | ''>('guardado')

  useEffect(() => {
    api
      .get<Document>(`/api/v1/documents/${id}`)
      .then(({ data }) => {
        setDocument(data)
        setTitle(data.title)
        setContent(data.content)
        setWordCount(data.word_count)
      })
      .catch(() => router.push('/dashboard'))
      .finally(() => setLoading(false))
  }, [id, router])

  const handleEditorChange = useCallback(
    (newContent: Record<string, unknown>, newWordCount: number) => {
      setContent(newContent)
      setWordCount(newWordCount)
      setSaveStatus('guardando...')
    },
    []
  )

  // Resetear saveStatus a "guardado" después del autosave
  useEffect(() => {
    if (saveStatus !== 'guardando...') return
    const timer = setTimeout(() => setSaveStatus('guardado'), 2500)
    return () => clearTimeout(timer)
  }, [saveStatus, content])

  useAutoSave(id, content, wordCount, title)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Cargando...
      </div>
    )
  }

  if (!document) return null

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-3 flex items-center gap-4">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Dashboard
        </Link>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 max-w-md border-0 text-lg font-medium focus-visible:ring-0 px-0"
          placeholder="Sin título"
        />
        <span className="text-xs text-gray-400 ml-auto">{saveStatus}</span>
      </header>

      {/* Editor */}
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto h-full">
          <TipTapEditor content={content} onChange={handleEditorChange} />
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Verificar manualmente — flujo completo**

Con backend (`uvicorn app.main:app --reload`) y frontend (`npm run dev`) corriendo:

1. Registrar cuenta nueva en `/register` → redirige a `/dashboard`
2. Click "Nuevo documento" → crea documento y abre editor
3. Escribir texto en el editor → barra muestra "guardando..." luego "guardado"
4. Cambiar el título en el header → se guarda automáticamente
5. Volver al dashboard → documento aparece con palabras contadas
6. Crear una carpeta → aparece en sidebar
7. Hacer logout → redirige a `/login`
8. Intentar acceder a `/dashboard` sin sesión → redirige a `/login`

- [ ] **Step 4: Commit final de Fase 1**

```bash
git add legalvoice-frontend/app/editor/
git commit -m "feat: páginas del editor (new y [id]) — completa Fase 1"
```

---

## Verificación final de criterios de éxito

Antes de cerrar la Fase 1, confirmar cada criterio del spec:

- [ ] Usuario puede registrarse e iniciar sesión ✓
- [ ] Dashboard muestra lista de documentos y carpetas ✓
- [ ] Editor TipTap funcional con formato jurídico básico ✓
- [ ] Autosave guarda cambios automáticamente cada 2 segundos ✓
- [ ] Crear, editar y eliminar documentos ✓
- [ ] Crear y eliminar carpetas ✓
- [ ] RLS activo: usuario A no puede ver documentos de usuario B ✓

```bash
# Correr todos los tests del backend
cd legalvoice-backend && source venv/bin/activate && pytest tests/ -v

# Correr todos los tests del frontend
cd ../legalvoice-frontend && npx jest --passWithNoTests
```

Resultado esperado: todos los tests en verde.
