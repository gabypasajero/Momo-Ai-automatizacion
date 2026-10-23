-- ===========================================================================
-- Panel de administración de la plataforma Momo AI (dueño del SaaS)
-- - platform_admins: quién administra la plataforma, con contraseña propia del panel
-- - ai_usage: consumo de IA por empresa para medir costos y márgenes
-- - Funciones security definer: el panel lee todas las empresas sin abrir RLS
-- ===========================================================================

create table momo.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  panel_password_hash text,
  unlocked_until timestamptz,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);
alter table momo.platform_admins enable row level security;
-- Sin políticas: solo se accede mediante las funciones de abajo.

create table momo.ai_usage (
  id bigint generated always as identity primary key,
  organization_id uuid not null references momo.organizations (id) on delete cascade,
  feature text not null check (feature in ('asistente_interno', 'vendedor')),
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cache_read_tokens integer not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  created_at timestamptz not null default now()
);
create index ai_usage_org_created_idx on momo.ai_usage (organization_id, created_at desc);
alter table momo.ai_usage enable row level security;
create policy ai_usage_select on momo.ai_usage for select to authenticated
  using ((select momo.has_role(organization_id, array['owner', 'admin'])));
create policy ai_usage_insert on momo.ai_usage for insert to authenticated
  with check ((select momo.has_role(organization_id)));

-- ¿El usuario es administrador de la plataforma? (muestra el acceso en el menú)
create or replace function momo.is_platform_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from momo.platform_admins where user_id = (select auth.uid())) $$;

-- Estado del panel: 'sin_acceso' | 'sin_clave' | 'bloqueado' | 'cerrado' | 'abierto'
create or replace function momo.admin_panel_state()
returns text language sql stable security definer set search_path = ''
as $$
  select case
    when a.user_id is null then 'sin_acceso'
    when a.panel_password_hash is null then 'sin_clave'
    when a.locked_until > now() then 'bloqueado'
    when a.unlocked_until > now() then 'abierto'
    else 'cerrado'
  end
  from (select 1) x
  left join momo.platform_admins a on a.user_id = (select auth.uid())
$$;

-- Crea la contraseña del panel (primera vez) o la cambia con el panel abierto
create or replace function momo.admin_set_password(new_password text)
returns void language plpgsql security definer set search_path = ''
as $$
declare st text := momo.admin_panel_state();
begin
  if st not in ('sin_clave', 'abierto') then raise exception 'no autorizado' using errcode = '42501'; end if;
  if length(new_password) < 10 then raise exception 'La contraseña debe tener al menos 10 caracteres' using errcode = '22023'; end if;
  update momo.platform_admins
     set panel_password_hash = extensions.crypt(new_password, extensions.gen_salt('bf', 10)),
         unlocked_until = now() + interval '30 minutes', failed_attempts = 0, locked_until = null
   where user_id = (select auth.uid());
end $$;

-- Abre el panel por 30 minutos; 5 intentos fallidos lo bloquean 15 minutos
create or replace function momo.admin_unlock(password text)
returns text language plpgsql security definer set search_path = ''
as $$
declare a momo.platform_admins;
begin
  select * into a from momo.platform_admins where user_id = (select auth.uid()) for update;
  if a.user_id is null then return 'sin_acceso'; end if;
  if a.locked_until > now() then return 'bloqueado'; end if;
  if a.panel_password_hash is not null and a.panel_password_hash = extensions.crypt(password, a.panel_password_hash) then
    update momo.platform_admins set unlocked_until = now() + interval '30 minutes', failed_attempts = 0
     where user_id = a.user_id;
    return 'abierto';
  end if;
  update momo.platform_admins
     set failed_attempts = a.failed_attempts + 1,
         locked_until = case when a.failed_attempts + 1 >= 5 then now() + interval '15 minutes' end
   where user_id = a.user_id;
  return case when a.failed_attempts + 1 >= 5 then 'bloqueado' else 'incorrecta' end;
end $$;

create or replace function momo.admin_lock()
returns void language sql security definer set search_path = ''
as $$ update momo.platform_admins set unlocked_until = null where user_id = (select auth.uid()) $$;

-- Resumen de todas las empresas (solo con el panel abierto)
create or replace function momo.admin_overview()
returns table (
  id uuid, name text, slug text, plan text, created_at timestamptz,
  members bigint, products bigint, knowledge bigint,
  conversations_30d bigint, messages_30d bigint, ai_messages_30d bigint,
  tickets_won_30d bigint, revenue_won_30d bigint,
  ai_cost_usd_30d numeric, last_activity timestamptz
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if momo.admin_panel_state() <> 'abierto' then raise exception 'panel cerrado' using errcode = '42501'; end if;
  return query
  select o.id, o.name, o.slug, o.plan, o.created_at,
    (select count(*) from momo.members m where m.organization_id = o.id),
    (select count(*) from momo.products p where p.organization_id = o.id and p.active),
    (select count(*) from momo.knowledge_entries k where k.organization_id = o.id),
    (select count(*) from momo.conversations c where c.organization_id = o.id and c.last_message_at > now() - interval '30 days'),
    (select count(*) from momo.messages g where g.organization_id = o.id and g.sent_at > now() - interval '30 days'),
    (select count(*) from momo.messages g where g.organization_id = o.id and g.author = 'ai' and g.sent_at > now() - interval '30 days'),
    (select count(*) from momo.tickets t where t.organization_id = o.id and t.status = 'won' and t.closed_at > now() - interval '30 days'),
    (select coalesce(sum(t.value_clp), 0)::bigint from momo.tickets t where t.organization_id = o.id and t.status = 'won' and t.closed_at > now() - interval '30 days'),
    (select coalesce(sum(u.cost_usd), 0) from momo.ai_usage u where u.organization_id = o.id and u.created_at > now() - interval '30 days'),
    (select max(g.sent_at) from momo.messages g where g.organization_id = o.id)
  from momo.organizations o
  order by o.created_at;
end $$;

create or replace function momo.admin_set_plan(org uuid, new_plan text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if momo.admin_panel_state() <> 'abierto' then raise exception 'panel cerrado' using errcode = '42501'; end if;
  update momo.organizations set plan = new_plan, updated_at = now() where id = org;
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'momo.is_platform_admin()', 'momo.admin_panel_state()', 'momo.admin_set_password(text)',
    'momo.admin_unlock(text)', 'momo.admin_lock()', 'momo.admin_overview()', 'momo.admin_set_plan(uuid, text)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

grant select, insert on momo.ai_usage to authenticated;

-- Dueño de la plataforma
insert into momo.platform_admins (user_id)
select id from auth.users where email = 'joshe.ovalle@gmail.com'
on conflict do nothing;
