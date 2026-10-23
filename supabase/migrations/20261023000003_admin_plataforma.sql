-- ===========================================================================
-- Panel de administración de la plataforma: empresas, solicitudes, consumo y seguridad
-- Todas las funciones exigen el panel abierto (contraseña propia, 30 minutos).
-- Los correos de las cuentas no se leen desde SQL: los entrega la función momo-usuarios (service_role).
-- ===========================================================================

create or replace function momo.admin_require_open()
returns void language plpgsql stable security definer set search_path = ''
as $$
begin
  if momo.admin_panel_state() <> 'abierto' then raise exception 'panel cerrado' using errcode = '42501'; end if;
end $$;

-- La contraseña del panel se crea una sola vez; para cambiarla se pide la actual.
create or replace function momo.admin_set_password(new_password text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if momo.admin_panel_state() <> 'sin_clave' then raise exception 'no autorizado' using errcode = '42501'; end if;
  if length(new_password) < 10 then raise exception 'La contraseña debe tener al menos 10 caracteres' using errcode = '22023'; end if;
  update momo.platform_admins
     set panel_password_hash = extensions.crypt(new_password, extensions.gen_salt('bf', 10)),
         unlocked_until = now() + interval '30 minutes', failed_attempts = 0, locked_until = null
   where user_id = (select auth.uid());
end $$;

create or replace function momo.admin_change_password(current_password text, new_password text)
returns text language plpgsql security definer set search_path = ''
as $$
declare a momo.platform_admins;
begin
  perform momo.admin_require_open();
  select * into a from momo.platform_admins where user_id = (select auth.uid());
  if a.panel_password_hash <> extensions.crypt(current_password, a.panel_password_hash) then return 'incorrecta'; end if;
  if length(new_password) < 10 then return 'corta'; end if;
  update momo.platform_admins
     set panel_password_hash = extensions.crypt(new_password, extensions.gen_salt('bf', 10))
   where user_id = a.user_id;
  return 'ok';
end $$;

-- Resumen de todas las empresas (reemplaza a admin_overview)
create or replace function momo.admin_resumen()
returns table (
  id uuid, name text, slug text, plan text, status text, created_at timestamptz,
  members bigint, owner_user_id uuid, products bigint, knowledge bigint,
  conversations_30d bigint, messages_30d bigint, ai_messages_30d bigint,
  tickets_won_30d bigint, revenue_won_30d bigint,
  ai_cost_usd_30d numeric, pending_requests bigint, last_activity timestamptz
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform momo.admin_require_open();
  return query
  select o.id, o.name, o.slug, o.plan, o.status, o.created_at,
    (select count(*) from momo.members m where m.organization_id = o.id),
    (select m.user_id from momo.members m where m.organization_id = o.id and m.role = 'owner' order by m.created_at limit 1),
    (select count(*) from momo.products p where p.organization_id = o.id and p.active),
    (select count(*) from momo.knowledge_entries k where k.organization_id = o.id),
    (select count(*) from momo.conversations c where c.organization_id = o.id and c.last_message_at > now() - interval '30 days'),
    (select count(*) from momo.messages g where g.organization_id = o.id and g.sent_at > now() - interval '30 days'),
    (select count(*) from momo.messages g where g.organization_id = o.id and g.author = 'ai' and g.sent_at > now() - interval '30 days'),
    (select count(*) from momo.tickets t where t.organization_id = o.id and t.status = 'won' and t.closed_at > now() - interval '30 days'),
    (select coalesce(sum(t.value_clp + t.delivery_clp), 0)::bigint from momo.tickets t where t.organization_id = o.id and t.status = 'won' and t.closed_at > now() - interval '30 days'),
    (select coalesce(sum(u.cost_usd), 0) from momo.ai_usage u where u.organization_id = o.id and u.created_at > now() - interval '30 days'),
    (select count(*) from momo.requests r where r.organization_id = o.id and r.status = 'pendiente'),
    (select max(g.sent_at) from momo.messages g where g.organization_id = o.id)
  from momo.organizations o
  order by o.created_at;
end $$;

-- Crea una empresa lista para usar: embudo base y asistente Momo con instrucciones iniciales.
create or replace function momo.admin_create_org(p_name text, p_plan text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
  v_pipeline uuid;
  v_base text;
  v_slug text;
  n int := 1;
begin
  perform momo.admin_require_open();
  if length(trim(p_name)) < 2 then raise exception 'Escribe el nombre de la empresa' using errcode = '22023'; end if;
  if p_plan not in ('emprende', 'pyme', 'empresa', 'corporativo') then raise exception 'Plan no válido' using errcode = '22023'; end if;
  v_base := trim(both '-' from regexp_replace(lower(translate(trim(p_name), 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun')), '[^a-z0-9]+', '-', 'g'));
  if v_base = '' then v_base := 'empresa'; end if;
  v_slug := v_base;
  while exists (select 1 from momo.organizations where slug = v_slug) loop
    n := n + 1;
    v_slug := v_base || '-' || n;
  end loop;

  insert into momo.organizations (name, slug, plan) values (trim(p_name), v_slug, p_plan) returning id into v_id;
  insert into momo.pipelines (organization_id, name) values (v_id, 'Ventas') returning id into v_pipeline;
  insert into momo.ai_assistants (organization_id, pipeline_id, name, system_prompt, model)
  values (v_id, v_pipeline, 'Momo',
    'Eres Momo, el asistente de ventas de ' || trim(p_name) || '. Atiendes a los clientes por chat en español de Chile, '
    || 'con un tono cercano, breve y profesional. Usa solo los productos, precios y políticas que conoces; si no sabes algo, '
    || 'dilo con honestidad y ofrece que una persona del equipo le responda. Tu objetivo es resolver dudas y ayudar a cerrar la venta.',
    'claude-opus-5-5');
  return v_id;
end $$;

create or replace function momo.admin_update_org(org uuid, p_name text, p_plan text, p_status text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  perform momo.admin_require_open();
  if length(trim(p_name)) < 2 then raise exception 'Escribe el nombre de la empresa' using errcode = '22023'; end if;
  if p_plan not in ('emprende', 'pyme', 'empresa', 'corporativo') then raise exception 'Plan no válido' using errcode = '22023'; end if;
  if p_status not in ('activa', 'suspendida') then raise exception 'Estado no válido' using errcode = '22023'; end if;
  update momo.organizations set name = trim(p_name), plan = p_plan, status = p_status where id = org;
end $$;

create or replace function momo.admin_list_requests(p_status text default null)
returns table (
  id uuid, organization_id uuid, organization_name text, kind text, detail text, message text,
  status text, created_by uuid, created_at timestamptz, resolved_at timestamptz
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform momo.admin_require_open();
  return query
  select r.id, r.organization_id, o.name, r.kind, r.detail, r.message, r.status, r.created_by, r.created_at, r.resolved_at
  from momo.requests r
  join momo.organizations o on o.id = r.organization_id
  where p_status is null or r.status = p_status
  order by (r.status = 'pendiente') desc, r.created_at desc
  limit 200;
end $$;

-- Aprobar un cambio de plan lo aplica a la empresa.
create or replace function momo.admin_resolve_request(req uuid, decision text)
returns void language plpgsql security definer set search_path = ''
as $$
declare r momo.requests;
begin
  perform momo.admin_require_open();
  if decision not in ('aprobada', 'rechazada', 'resuelta') then raise exception 'Decisión no válida' using errcode = '22023'; end if;
  select * into r from momo.requests where id = req for update;
  if r.id is null then raise exception 'La solicitud no existe' using errcode = 'P0002'; end if;
  if decision = 'aprobada' and r.kind = 'plan' then
    if r.detail not in ('emprende', 'pyme', 'empresa', 'corporativo') then raise exception 'Plan no válido' using errcode = '22023'; end if;
    update momo.organizations set plan = r.detail where id = r.organization_id;
  end if;
  update momo.requests set status = decision, resolved_at = now() where id = req;
end $$;

create or replace function momo.admin_ai_usage(days int default 30)
returns table (day date, organization_id uuid, organization_name text, feature text, calls bigint,
  input_tokens bigint, output_tokens bigint, cache_read_tokens bigint, cost_usd numeric)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform momo.admin_require_open();
  return query
  select (u.created_at at time zone 'America/Santiago')::date, u.organization_id, o.name, u.feature, count(*),
    sum(u.input_tokens)::bigint, sum(u.output_tokens)::bigint, sum(u.cache_read_tokens)::bigint, sum(u.cost_usd)
  from momo.ai_usage u join momo.organizations o on o.id = u.organization_id
  where u.created_at > now() - make_interval(days => greatest(1, least(days, 365)))
  group by 1, 2, 3, 4
  order by 1 desc, 9 desc;
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'momo.admin_require_open()', 'momo.admin_set_password(text)', 'momo.admin_change_password(text, text)',
    'momo.admin_resumen()', 'momo.admin_create_org(text, text)', 'momo.admin_update_org(uuid, text, text, text)',
    'momo.admin_list_requests(text)', 'momo.admin_resolve_request(uuid, text)', 'momo.admin_ai_usage(int)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
