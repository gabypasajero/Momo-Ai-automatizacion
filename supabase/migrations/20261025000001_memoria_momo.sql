-- Memoria de Momo: respuestas aprobadas o corregidas por el equipo. Momo las usa como ejemplo.
create table if not exists momo.momo_memory (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references momo.organizations(id) on delete cascade,
  kind text not null check (kind in ('aprobada', 'corregida')),
  question text not null check (char_length(question) between 1 and 1000),
  answer text not null check (char_length(answer) between 1 and 3000),
  source text not null default 'entrenamiento' check (source in ('entrenamiento', 'conversacion')),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists momo_memory_org_idx on momo.momo_memory(organization_id, created_at desc);
alter table momo.momo_memory enable row level security;
create policy "miembros leen" on momo.momo_memory for select to authenticated using (momo.has_role(organization_id));
create policy "equipo crea" on momo.momo_memory for insert to authenticated with check (momo.has_role(organization_id, array['owner', 'admin', 'agent']));
create policy "equipo borra" on momo.momo_memory for delete to authenticated using (momo.has_role(organization_id, array['owner', 'admin', 'agent']));
grant select, insert, delete on momo.momo_memory to authenticated;

-- Registro de las conversaciones de entrenamiento (sin fotos), para revisarlas y aprender de ellas.
create table if not exists momo.training_sessions (
  id uuid primary key,
  organization_id uuid not null references momo.organizations(id) on delete cascade,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  messages jsonb not null default '[]'::jsonb,
  turns int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists training_sessions_org_idx on momo.training_sessions(organization_id, updated_at desc);
alter table momo.training_sessions enable row level security;
create policy "miembros leen" on momo.training_sessions for select to authenticated using (momo.has_role(organization_id));
create policy "equipo crea" on momo.training_sessions for insert to authenticated with check (momo.has_role(organization_id, array['owner', 'admin', 'agent']));
create policy "equipo actualiza" on momo.training_sessions for update to authenticated
  using (momo.has_role(organization_id, array['owner', 'admin', 'agent'])) with check (momo.has_role(organization_id, array['owner', 'admin', 'agent']));
grant select, insert, update on momo.training_sessions to authenticated;
