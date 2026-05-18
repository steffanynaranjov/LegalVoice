-- ============================================================
-- LegalVoice — Supabase Schema
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Extensiones
create extension if not exists "uuid-ossp";

-- 2. Tabla users (espejo de auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  firm_name text,
  created_at timestamptz default now()
);

-- 3. Tabla folders
create table public.folders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  name text not null,
  client_name text,
  color text default '#4a6741'
);

-- 4. Tabla documents
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  folder_id uuid references public.folders on delete set null,
  title text not null default 'Sin título',
  content jsonb default '{}',
  word_count integer default 0,
  updated_at timestamptz default now()
);

-- 5. Row Level Security
alter table public.users enable row level security;
alter table public.folders enable row level security;
alter table public.documents enable row level security;

create policy "users_own_profile"
  on public.users for all
  using (auth.uid() = id);

create policy "users_own_folders"
  on public.folders for all
  using (auth.uid() = user_id);

create policy "users_own_documents"
  on public.documents for all
  using (auth.uid() = user_id);

-- 6. Trigger: auto-crear perfil de usuario al registrarse
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

-- 7. Trigger: auto-actualizar updated_at en documents
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
