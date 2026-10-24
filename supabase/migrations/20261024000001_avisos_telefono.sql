-- Avisos al teléfono (Web Push). Cada teléfono que activa los avisos guarda aquí su "dirección".
create table if not exists momo.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on momo.push_subscriptions(user_id);
alter table momo.push_subscriptions enable row level security;
create policy push_own_select on momo.push_subscriptions for select to authenticated using (user_id = auth.uid());
create policy push_own_insert on momo.push_subscriptions for insert to authenticated with check (user_id = auth.uid());
create policy push_own_update on momo.push_subscriptions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy push_own_delete on momo.push_subscriptions for delete to authenticated using (user_id = auth.uid());
grant select, insert, update, delete on momo.push_subscriptions to authenticated;

-- Cuando escribe un cliente, se avisa a todo el equipo (menos a quien lo registró).
-- La URL y la clave compartida viven en Vault: momo_avisos_url y momo_avisos_secret.
create or replace function momo.avisar_mensaje_cliente() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_url text; v_secret text; v_subs jsonb; v_name text;
begin
  if new.author <> 'client' then return new; end if;
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'momo_avisos_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'momo_avisos_secret';
  if v_url is null or v_secret is null then return new; end if;
  select jsonb_agg(jsonb_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth))
    into v_subs
    from momo.push_subscriptions s join momo.members m on m.user_id = s.user_id
   where m.organization_id = new.organization_id
     and s.user_id is distinct from coalesce(auth.uid(), new.sent_by_user_id);
  if v_subs is null then return new; end if;
  select ct.name into v_name from momo.conversations c join momo.contacts ct on ct.id = c.contact_id where c.id = new.conversation_id;
  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-momo-secret', v_secret),
    body := jsonb_build_object(
      'title', coalesce(v_name, 'Un cliente') || ' te escribió',
      'body', left(new.body, 140),
      'url', '/conversaciones?c=' || new.conversation_id,
      'tag', new.conversation_id::text,
      'subscriptions', v_subs));
  return new;
exception when others then
  return new; -- un aviso fallido nunca debe impedir guardar el mensaje
end $$;
revoke all on function momo.avisar_mensaje_cliente() from public, anon, authenticated;

create trigger messages_avisar_cliente after insert on momo.messages
  for each row when (new.author = 'client') execute function momo.avisar_mensaje_cliente();

-- El servidor de la app borra los teléfonos que ya no existen (desinstalaron o bloquearon avisos).
create or replace function momo.avisos_borrar(p_secret text, p_endpoints text[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_secret is null or p_secret <> (select decrypted_secret from vault.decrypted_secrets where name = 'momo_avisos_secret') then
    raise exception 'no autorizado';
  end if;
  delete from momo.push_subscriptions where endpoint = any(p_endpoints);
end $$;
revoke all on function momo.avisos_borrar(text, text[]) from public;
grant execute on function momo.avisos_borrar(text, text[]) to anon, authenticated;
