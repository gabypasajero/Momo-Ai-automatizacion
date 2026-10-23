-- ===========================================================================
-- Momo AI · concepto DTO (más simple que el embudo tipo Vambe)
-- - La venta vive dentro de la conversación: pasos Pregunta → Cotizado → Pagado → Despachado
-- - Conversaciones con canal propio: permite registrar chats de Marketplace sin API (modo copiloto)
-- - Dudas que Momo no supo responder, solicitudes de las empresas a Momo AI
-- - Gestión de equipo con reglas (nadie se cambia su propio rol, solo un dueño toca dueños)
-- - Funciones del panel de administración de la plataforma
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Columnas nuevas
-- ---------------------------------------------------------------------------

alter table momo.organizations
  add column status text not null default 'activa' check (status in ('activa', 'suspendida')),
  -- Personas a las que Momo deriva (cocinas a medida, proyectos fuera de catálogo…): [{label, phone}]
  add column handoff_contacts jsonb not null default '[]'::jsonb;

update momo.organizations
   set handoff_contacts = '[{"label":"Rachel","phone":"+56931719740"},{"label":"Área de Diseño","phone":"+56957464151"}]'::jsonb
 where slug in ('detodito-outlet', 'muebles-hogar-molina');

alter table momo.contacts
  add column comuna text,
  add column notes text;

alter table momo.conversations
  add column channel text not null default 'marketplace'
    check (channel in ('marketplace', 'messenger', 'whatsapp', 'instagram', 'tiktok', 'web', 'telefono', 'presencial', 'otro')),
  add column last_message_preview text,
  add column last_message_author text check (last_message_author in ('client', 'ai', 'human', 'system')),
  alter column channel_account_id drop not null,
  drop constraint conversations_channel_account_id_contact_id_key;
create index conversations_contact_idx on momo.conversations (contact_id);
create index conversations_waiting_idx on momo.conversations (organization_id, status, ai_enabled, last_message_author);

alter table momo.tickets
  alter column pipeline_id drop not null,
  alter column stage_id drop not null,
  add column step text not null default 'pregunta' check (step in ('pregunta', 'cotizado', 'pagado', 'despachado')),
  add column design boolean not null default false,
  add column product_id uuid references momo.products (id) on delete set null,
  add column title text,
  add column delivery_clp integer not null default 0 check (delivery_clp >= 0),
  add column notes text,
  add column lost_reason text;
-- Una venta por conversación.
create unique index tickets_conversation_uidx on momo.tickets (conversation_id) where conversation_id is not null;
create index tickets_contact_idx on momo.tickets (contact_id);
create index tickets_org_closed_idx on momo.tickets (organization_id, status, closed_at desc);

-- ---------------------------------------------------------------------------
-- Dudas que Momo no supo responder (se convierten en conocimiento)
-- ---------------------------------------------------------------------------

create table momo.knowledge_gaps (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references momo.organizations (id) on delete cascade,
  question text not null,
  conversation_id uuid references momo.conversations (id) on delete set null,
  status text not null default 'pendiente' check (status in ('pendiente', 'resuelta', 'descartada')),
  snoozed_until timestamptz,
  knowledge_entry_id uuid references momo.knowledge_entries (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index knowledge_gaps_org_idx on momo.knowledge_gaps (organization_id, status, created_at);
create trigger touch_updated_at before update on momo.knowledge_gaps for each row execute function momo.touch_updated_at();

alter table momo.knowledge_gaps enable row level security;
create policy "miembros leen" on momo.knowledge_gaps for select to authenticated using ((select momo.has_role(organization_id)));
create policy "equipo crea" on momo.knowledge_gaps for insert to authenticated with check ((select momo.has_role(organization_id, array['owner', 'admin', 'agent'])));
create policy "equipo edita" on momo.knowledge_gaps for update to authenticated
  using ((select momo.has_role(organization_id, array['owner', 'admin', 'agent'])))
  with check ((select momo.has_role(organization_id, array['owner', 'admin', 'agent'])));
create policy "admin elimina" on momo.knowledge_gaps for delete to authenticated using ((select momo.has_role(organization_id, array['owner', 'admin'])));
grant select, insert, update, delete on momo.knowledge_gaps to authenticated;

-- ---------------------------------------------------------------------------
-- Solicitudes de las empresas a Momo AI (cambio de plan, conexión de canales, soporte)
-- ---------------------------------------------------------------------------

create table momo.requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references momo.organizations (id) on delete cascade,
  kind text not null check (kind in ('plan', 'canal', 'soporte')),
  -- plan: id del plan pedido · canal: tipo de canal · soporte: asunto
  detail text not null,
  message text,
  status text not null default 'pendiente' check (status in ('pendiente', 'aprobada', 'rechazada', 'resuelta')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index requests_org_idx on momo.requests (organization_id, created_at desc);
create index requests_pending_idx on momo.requests (status, created_at) where status = 'pendiente';

alter table momo.requests enable row level security;
create policy "miembros leen" on momo.requests for select to authenticated using ((select momo.has_role(organization_id)));
create policy "owner y admin solicitan" on momo.requests for insert to authenticated
  with check ((select momo.has_role(organization_id, array['owner', 'admin'])) and status = 'pendiente' and created_by = (select auth.uid()));
grant select, insert on momo.requests to authenticated;

-- ---------------------------------------------------------------------------
-- Integridad entre empresas: nada puede apuntar a datos de otra empresa
-- ---------------------------------------------------------------------------

create or replace function momo.guard_same_org()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_table_name = 'messages' then
    perform 1 from momo.conversations where id = new.conversation_id and organization_id = new.organization_id;
    if not found then raise exception 'La conversación no pertenece a la empresa' using errcode = '42501'; end if;
  elsif tg_table_name = 'conversations' then
    perform 1 from momo.contacts where id = new.contact_id and organization_id = new.organization_id;
    if not found then raise exception 'El cliente no pertenece a la empresa' using errcode = '42501'; end if;
  elsif tg_table_name = 'tickets' then
    perform 1 from momo.contacts where id = new.contact_id and organization_id = new.organization_id;
    if not found then raise exception 'El cliente no pertenece a la empresa' using errcode = '42501'; end if;
    if new.conversation_id is not null then
      perform 1 from momo.conversations where id = new.conversation_id and organization_id = new.organization_id;
      if not found then raise exception 'La conversación no pertenece a la empresa' using errcode = '42501'; end if;
    end if;
    if new.product_id is not null then
      perform 1 from momo.products where id = new.product_id and organization_id = new.organization_id;
      if not found then raise exception 'El producto no pertenece a la empresa' using errcode = '42501'; end if;
    end if;
  elsif tg_table_name = 'knowledge_gaps' then
    if new.conversation_id is not null then
      perform 1 from momo.conversations where id = new.conversation_id and organization_id = new.organization_id;
      if not found then raise exception 'La conversación no pertenece a la empresa' using errcode = '42501'; end if;
    end if;
  end if;
  return new;
end $$;

create trigger guard_same_org before insert or update on momo.messages for each row execute function momo.guard_same_org();
create trigger guard_same_org before insert or update on momo.conversations for each row execute function momo.guard_same_org();
create trigger guard_same_org before insert or update on momo.tickets for each row execute function momo.guard_same_org();
create trigger guard_same_org before insert or update on momo.knowledge_gaps for each row execute function momo.guard_same_org();

-- Cada mensaje actualiza el resumen de su conversación (bandeja y "Te esperan").
create or replace function momo.on_message_insert()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update momo.conversations c set
    last_message_at = greatest(coalesce(c.last_message_at, new.sent_at), new.sent_at),
    last_message_preview = left(coalesce(new.body, ''), 160),
    last_message_author = new.author,
    last_inbound_at = case when new.author = 'client' then new.sent_at else c.last_inbound_at end,
    unread_count = case when new.author = 'client' then c.unread_count + 1 else 0 end
  where c.id = new.conversation_id and c.organization_id = new.organization_id;
  return new;
end $$;
create trigger messages_after_insert after insert on momo.messages for each row execute function momo.on_message_insert();

revoke all on function momo.guard_same_org() from public, anon, authenticated;
revoke all on function momo.on_message_insert() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Equipo: lo gestiona la función momo-usuarios (service_role), que aplica las reglas
-- (nadie se cambia su propio rol, solo un dueño nombra o quita dueños) y lee los correos.
-- ---------------------------------------------------------------------------

create or replace function momo.user_id_by_email(p_email text)
returns uuid language sql stable security definer set search_path = ''
as $$ select id from auth.users where lower(email) = lower(trim(p_email)) limit 1 $$;
revoke all on function momo.user_id_by_email(text) from public, anon, authenticated;
grant execute on function momo.user_id_by_email(text) to service_role;

update momo.ai_assistants set model = 'claude-opus-5-5' where model <> 'claude-opus-5-5';
