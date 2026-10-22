-- Datos iniciales del piloto: DeToditoOutlet (Rachel) y Muebles y Hogar Molina.
-- Ejecutar una vez, después de la migración momo_core. Es idempotente en empresas.

-- 1) Empresas
insert into momo.organizations (name, slug, plan) values
  ('DeToditoOutlet', 'detodito-outlet', 'pyme'),
  ('Muebles y Hogar Molina', 'muebles-hogar-molina', 'pyme')
on conflict (slug) do nothing;

-- 2) Embudo de ventas con sus etapas (key = identificador que usa la IA en move_ticket)
insert into momo.pipelines (organization_id, name)
select o.id, 'Ventas | ' || o.name from momo.organizations o
where not exists (select 1 from momo.pipelines p where p.organization_id = o.id);

insert into momo.pipeline_stages (organization_id, pipeline_id, key, name, emoji, tone, position, is_handoff)
select p.organization_id, p.id, s.key, s.name, s.emoji, s.tone, s.pos, s.handoff
from momo.pipelines p
cross join (values
  ('new', 'Nuevo contacto', '👋', 'border-t-muted', 0, false),
  ('human', 'Asistencia humana', '🙋', 'border-t-danger', 1, true),
  ('standard', 'Asesoría muebles estándar', '🪑', 'border-t-brand-500', 2, false),
  ('custom', 'Proyecto a medida', '📐', 'border-t-accent', 3, false),
  ('quote', 'Revisión de cotización', '📄', 'border-t-warning-chart', 4, false)
) as s(key, name, emoji, tone, pos, handoff)
on conflict (pipeline_id, key) do nothing;

-- 3) Catálogo de DTO: se copia desde su tabla public.productos (mismo proyecto Supabase)
insert into momo.products (organization_id, name, category, description, dimensions, price_clp, sale_price_clp,
                           image_url, source, source_id, source_url, customizable, active, synced_at)
select o.id, p.nombre, p.categoria, p.descripcion, p.medidas, p.precio, p.precio_oferta, p.imagen_url,
       'dto', p.id::text, 'https://detoditooutlet.cl', coalesce(p.personalizable, false), coalesce(p.activo, true), now()
from public.productos p
cross join (select id from momo.organizations where slug = 'detodito-outlet') o
where p.precio is not null
on conflict (organization_id, source, source_id) do update
  set name = excluded.name, price_clp = excluded.price_clp, sale_price_clp = excluded.sale_price_clp,
      description = excluded.description, active = excluded.active, synced_at = now();

-- 4) Catálogo de Molina: API pública de WooCommerce, descargada por la propia base con pg_net.
--    Paso A (pide las páginas; la respuesta llega en segundos a net._http_response):
--      select net.http_get('https://mueblesyhogarmolina.cl/wp-json/wc/store/v1/products?per_page=100&page=' || p)
--      from generate_series(1, 2) p;
--    Paso B: ver docs/catalogo.md para la consulta que inserta las respuestas en momo.products.

-- Los asistentes y su base de conocimiento (políticas de despacho, pagos y garantías)
-- se cargaron desde detoditooutlet.cl/legal: ver docs/catalogo.md.
