-- Momo AI · esquema base multiempresa
-- Aplicada en el proyecto Supabase "DTO detoditooutlet" en 5 pasos (momo_core_1 … momo_core_5);
-- este archivo es el equivalente completo para recrear el esquema en un proyecto nuevo.
-- Todo vive en el esquema `momo` para no mezclarse con otras tablas del proyecto.
-- Cada tabla de negocio lleva organization_id y una política RLS: nadie ve datos de otra empresa.

create schema if not exists momo;

revoke all on schema momo from public, anon;
grant usage on schema momo to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------

create or replace function momo.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Empresas y miembros
-- ---------------------------------------------------------------------------

create table momo.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  plan text not null default 'emprende' check (plan in ('emprende', 'pyme', 'empresa', 'corporativo')),
  -- Variables de marca blanca (sobrescriben la paleta DTO por defecto).
  brand jsonb not null default '{}'::jsonb,
  timezone text not null default 'America/Santiago',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table momo.members (
  organization_id uuid not null references momo.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'agent' check (role in ('owner', 'admin', 'agent', 'viewer')),
  display_name text,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index members_user_idx on momo.members (user_id);

-- security definer: evita recursión de RLS al consultar members desde las políticas.
create or replace function momo.has_role(org uuid, roles text[] default array['owner', 'admin', 'agent', 'viewer'])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from momo.members m
    where m.organization_id = org
      and m.user_id = (select auth.uid())
      and m.role = any (roles)
  );
$$;
revoke all on function momo.has_role(uuid, text[]) from public, anon;
grant execute on function momo.has_role(uuid, text[]) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Canales (Messenger/Marketplace, WhatsApp, Instagram, TikTok)
-- ---------------------------------------------------------------------------

create table momo.channel_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references momo.organizations (id) on delete cascade,
  type text not null check (type in ('messenger', 'whatsapp', 'instagram', 'tiktok')),
  name text not null,
  handle text,
  -- ID de la Página de Facebook, número de WhatsApp, etc. Es el que llega en los webhooks.
  external_id text not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'error', 'disconnected')),
  -- Referencia al secreto en Supabase Vault. Nunca se guarda el token en texto plano.
  access_token_secret_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (type, external_id)
);
create index channel_accounts_org_idx on momo.channel_accounts (organization_id);

-- ---------------------------------------------------------------------------
-- Contactos
-- ---------------------------------------------------------------------------

create table momo.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references momo.organizations (id) on delete cascade,
  name text not null,
  phone text,
  email text,
  tags text[] not null default '{}',
  owner_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contacts_org_idx on momo.contacts (organization_id, created_at desc);

-- Un contacto puede escribir por varios canales; cada canal lo identifica distinto (PSID, teléfono…).
create table momo.contact_identities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references momo.organizations (id) on delete cascade,
  contact_id uuid not null references momo.contacts (id) on delete cascade,
  channel_account_id uuid not null references momo.channel_accounts (id) on delete cascade,
  external_id text not null,
  created_at timestamptz not null default now(),
  unique (channel_account_id, external_id)
);
create index contact_identities_contact_idx on momo.contact_identities (contact_id);

-- ---------------------------------------------------------------------------
-- Embudos
-- ---------------------------------------------------------------------------

create table momo.pipelines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references momo.organizations (id) on delete cascade,
  name text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index pipelines_org_idx on momo.pipelines (organization_id);

create table momo.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references momo.organizations (id) on delete cascade,
  pipeline_id uuid not null references momo.pipelines (id) on delete cascade,
  -- Identificador estable que usa la IA para mover tickets ("human", "quote"…).
  key text not null,
  name text not null,
  emoji text,
  tone text,
  position int not null default 0,
  is_handoff boolean not null default false,
  unique (pipeline_id, key)
);
create index pipeline_stages_org_idx on momo.pipeline_stages (organization_id);

-- ---------------------------------------------------------------------------
-- Conversaciones y mensajes
-- ---------------------------------------------------------------------------

create table momo.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references momo.organizations (id) on delete cascade,
  contact_id uuid not null references momo.contacts (id) on delete cascade,
  channel_account_id uuid not null references momo.channel_accounts (id) on delete cascade,
  ai_enabled boolean not null default true,
  status text not null default 'open' check (status in ('open', 'closed')),
  assigned_user_id uuid references auth.users (id) on delete set null,
  unread_count int not null default 0,
  last_message_at timestamptz,
  -- Para la ventana de 24 h de Meta: solo se responde libremente hasta 24 h después de esto.
  last_inbound_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel_account_id, contact_id)
);
create index conversations_inbox_idx on momo.conversations (organization_id, last_message_at desc);

create table momo.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references momo.organizations (id) on delete cascade,
  conversation_id uuid not null references momo.conversations (id) on delete cascade,
  author text not null check (author in ('client', 'ai', 'human', 'system')),
  body text,
  attachments jsonb not null default '[]'::jsonb,
  -- ID del mensaje en Meta; evita duplicados si el webhook llega dos veces.
  external_id text,
  sent_by_user_id uuid references auth.users (id) on delete set null,
  sent_at timestamptz not null default now(),
  unique (conversation_id, external_id)
);
create index messages_conversation_idx on momo.messages (conversation_id, sent_at);
create index messages_org_idx on momo.messages (organization_id, sent_at desc);

-- ---------------------------------------------------------------------------
-- Tickets (tarjetas del Kanban)
-- ---------------------------------------------------------------------------

create table momo.tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references momo.organizations (id) on delete cascade,
  pipeline_id uuid not null references momo.pipelines (id) on delete cascade,
  stage_id uuid not null references momo.pipeline_stages (id) on delete restrict,
  contact_id uuid not null references momo.contacts (id) on delete cascade,
  conversation_id uuid references momo.conversations (id) on delete set null,
  value_clp bigint not null default 0 check (value_clp >= 0),
  status text not null default 'open' check (status in ('open', 'won', 'lost')),
  ai_handled boolean not null default true,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tickets_board_idx on momo.tickets (organization_id, pipeline_id, status);
create index tickets_stage_idx on momo.tickets (stage_id);

-- ---------------------------------------------------------------------------
-- Catálogo (lo consulta la IA para responder precios y disponibilidad)
-- ---------------------------------------------------------------------------

create table momo.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references momo.organizations (id) on delete cascade,
  name text not null,
  category text,
  description text,
  dimensions text,
  price_clp int not null check (price_clp >= 0),
  sale_price_clp int check (sale_price_clp >= 0),
  image_url text,
  source text not null default 'manual',
  source_id text,
  source_url text,
  customizable boolean not null default false,
  in_stock boolean not null default true,
  active boolean not null default true,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    setweight(to_tsvector('spanish', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(category, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(description, '')), 'C')
  ) stored,
  unique (organization_id, source, source_id)
);
create index products_org_idx on momo.products (organization_id, active);
create index products_search_idx on momo.products using gin (search);

-- ---------------------------------------------------------------------------
-- Asistentes de IA y su conocimiento
-- ---------------------------------------------------------------------------

create table momo.ai_assistants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references momo.organizations (id) on delete cascade,
  pipeline_id uuid references momo.pipelines (id) on delete set null,
  name text not null,
  emoji text,
  system_prompt text not null default '',
  model text not null default 'claude-sonnet-5-5',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ai_assistants_org_idx on momo.ai_assistants (organization_id);

-- Políticas del negocio: despacho, pagos, horarios, garantías, preguntas frecuentes.
create table momo.knowledge_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references momo.organizations (id) on delete cascade,
  assistant_id uuid references momo.ai_assistants (id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index knowledge_entries_org_idx on momo.knowledge_entries (organization_id);

-- ---------------------------------------------------------------------------
-- Consumo (límites de cada plan) y bandeja de webhooks
-- ---------------------------------------------------------------------------

create table momo.usage_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references momo.organizations (id) on delete cascade,
  kind text not null check (kind in ('ai_conversation', 'ai_message', 'outbound_message')),
  quantity int not null default 1,
  occurred_at timestamptz not null default now()
);
create index usage_events_org_idx on momo.usage_events (organization_id, kind, occurred_at desc);

-- Registro crudo de lo que envía Meta. Solo lo usa el backend (service_role).
create table momo.webhook_events (
  id bigint generated always as identity primary key,
  provider text not null,
  external_id text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text,
  unique (provider, external_id)
);
create index webhook_events_pending_idx on momo.webhook_events (received_at) where processed_at is null;

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['organizations', 'channel_accounts', 'contacts', 'conversations', 'tickets', 'products', 'ai_assistants', 'knowledge_entries']
  loop
    execute format('create trigger touch_updated_at before update on momo.%I for each row execute function momo.touch_updated_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Seguridad por fila (RLS)
-- Lectura: cualquier miembro. Escritura: owner, admin y agent. Viewer solo lee.
-- ---------------------------------------------------------------------------

alter table momo.organizations enable row level security;
alter table momo.members enable row level security;
alter table momo.webhook_events enable row level security; -- sin políticas: solo service_role

create policy "miembros ven su empresa" on momo.organizations
  for select to authenticated using (momo.has_role(id));
create policy "owner y admin editan su empresa" on momo.organizations
  for update to authenticated using (momo.has_role(id, array['owner', 'admin'])) with check (momo.has_role(id, array['owner', 'admin']));

create policy "miembros ven al equipo" on momo.members
  for select to authenticated using (momo.has_role(organization_id));
create policy "owner y admin gestionan el equipo" on momo.members
  for all to authenticated using (momo.has_role(organization_id, array['owner', 'admin'])) with check (momo.has_role(organization_id, array['owner', 'admin']));

do $$
declare t text;
begin
  foreach t in array array['channel_accounts', 'contacts', 'contact_identities', 'pipelines', 'pipeline_stages', 'conversations', 'messages', 'tickets', 'products', 'ai_assistants', 'knowledge_entries', 'usage_events']
  loop
    execute format('alter table momo.%I enable row level security', t);
    execute format($p$create policy "miembros leen" on momo.%I for select to authenticated using (momo.has_role(organization_id))$p$, t);
    -- El consumo solo lo registra el backend: los usuarios lo leen, no lo escriben.
    if t <> 'usage_events' then
      execute format($p$create policy "equipo crea" on momo.%I for insert to authenticated with check (momo.has_role(organization_id, array['owner', 'admin', 'agent']))$p$, t);
      execute format($p$create policy "equipo edita" on momo.%I for update to authenticated using (momo.has_role(organization_id, array['owner', 'admin', 'agent'])) with check (momo.has_role(organization_id, array['owner', 'admin', 'agent']))$p$, t);
      execute format($p$create policy "admin elimina" on momo.%I for delete to authenticated using (momo.has_role(organization_id, array['owner', 'admin']))$p$, t);
    end if;
  end loop;
end $$;

grant select, insert, update, delete on all tables in schema momo to authenticated;
grant all on all tables in schema momo to service_role;
grant usage, select on all sequences in schema momo to authenticated, service_role;
revoke all on momo.webhook_events from authenticated;
revoke insert, update, delete on momo.usage_events from authenticated;
