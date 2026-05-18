# LegalVoice — Fase 1: Auth + Editor
**Fecha:** 2026-05-17
**Alcance:** MVP Fase 1 (Semanas 1–3)

---

## Objetivo

Construir el núcleo funcional de LegalVoice: autenticación de usuarios y editor de documentos jurídicos con guardado automático. Esta fase no incluye voz, IA ni exportación.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 + TypeScript + App Router |
| Estilos | Tailwind CSS + shadcn/ui |
| Editor | TipTap v2 |
| Auth | Supabase Auth (cliente directo desde frontend) |
| Backend | FastAPI + Python 3.11 |
| Base de datos | Supabase (PostgreSQL + RLS) |

---

## Flujo de autenticación

Supabase Auth maneja login/registro directamente desde el frontend. Al autenticarse, Supabase devuelve un JWT que se adjunta como Bearer token en cada llamada al backend FastAPI. El backend valida el JWT contra Supabase en cada endpoint protegido.

```
Browser ──login/register──▶ Supabase Auth
Browser ──request + JWT──▶ FastAPI ──validar JWT──▶ Supabase
FastAPI ──query──▶ Supabase DB
```

---

## Frontend

### Rutas

| Ruta | Descripción |
|------|-------------|
| `/login` | Formulario de acceso con Supabase Auth |
| `/register` | Formulario de registro de cuenta |
| `/dashboard` | Lista de documentos y carpetas del usuario |
| `/editor/new` | Crear documento nuevo |
| `/editor/[id]` | Editar documento existente |

Rutas `/editor` y `/dashboard` son protegidas — redirigen a `/login` si no hay sesión activa.

### Componentes clave

**Editor:**
- `TipTapEditor.tsx` — núcleo del editor con extensiones jurídicas (headings, bold, italic, underline, listas, alineación)
- `Toolbar.tsx` — barra de herramientas de formato
- `WordCount.tsx` — contador de palabras en tiempo real

**Documentos:**
- `DocumentCard.tsx` — tarjeta con título, carpeta, fecha y word count
- `DocumentList.tsx` — grid/lista de documentos del dashboard
- `FolderTree.tsx` — navegación por carpetas en sidebar

### Hooks

- `useAutoSave.ts` — debounce de 2s sobre cambios en el editor; llama `PUT /documents/{id}`
- `useDocuments.ts` — fetch y cache de lista de documentos

### Lib

- `lib/supabase.ts` — cliente Supabase con variables de entorno
- `lib/api.ts` — cliente axios con interceptor que inyecta JWT en headers

---

## Backend (FastAPI)

### Middleware de autenticación

Cada endpoint protegido valida el JWT de Supabase extrayendo el `user_id` del token. Si el token es inválido o expirado, retorna 401.

### Endpoints — Fase 1

```
GET    /api/v1/documents        → lista documentos del usuario autenticado
POST   /api/v1/documents        → crea documento nuevo
GET    /api/v1/documents/{id}   → obtiene un documento
PUT    /api/v1/documents/{id}   → actualiza contenido (autosave)
DELETE /api/v1/documents/{id}   → elimina documento

GET    /api/v1/folders          → lista carpetas del usuario
POST   /api/v1/folders          → crea carpeta nueva
DELETE /api/v1/folders/{id}     → elimina carpeta
```

### Estructura de carpetas

```
lexvoice-backend/
├── app/
│   ├── main.py
│   ├── api/routes/
│   │   ├── documents.py
│   │   └── folders.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py      ← validación JWT Supabase
│   │   └── database.py
│   ├── models/
│   │   ├── document.py
│   │   └── folder.py
│   └── schemas/
│       ├── document.py      ← Pydantic v2
│       └── folder.py
├── requirements.txt
└── .env
```

---

## Base de datos (Supabase)

### Tablas

**users**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK, sincronizado con Supabase Auth |
| email | text | |
| full_name | text | |
| firm_name | text | nombre del despacho |
| created_at | timestamptz | |

**folders**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| name | text | |
| client_name | text | |
| color | text | hex color |

**documents**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| folder_id | uuid | FK → folders, nullable |
| title | text | |
| content | jsonb | formato TipTap JSON |
| word_count | integer | |
| updated_at | timestamptz | |

### Row Level Security

Todas las tablas tienen RLS habilitado. Política base: `user_id = auth.uid()` — cada usuario solo accede a sus propios registros.

---

## Variables de entorno

**Frontend (`.env.local`)**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend (`.env`)**
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SECRET_KEY=
CORS_ORIGINS=http://localhost:3000
```

---

## Criterios de éxito — Fase 1

- [ ] Usuario puede registrarse e iniciar sesión
- [ ] Dashboard muestra lista de documentos y carpetas
- [ ] Editor TipTap funcional con formato jurídico básico
- [ ] Autosave guarda cambios automáticamente cada 2 segundos
- [ ] Crear, editar y eliminar documentos
- [ ] Crear y eliminar carpetas
- [ ] RLS activo: usuario A no puede ver documentos de usuario B
