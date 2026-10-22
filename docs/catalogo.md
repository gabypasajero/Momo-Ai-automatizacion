# Catálogo y conocimiento de la IA

## Dónde viven los datos

Momo usa el esquema **`momo`** dentro del proyecto Supabase **"DTO detoditooutlet"**. Las tablas de la tienda DTO (`public.productos`, `public.vendedores`, etc.) no se tocaron.

| Empresa | Productos | Origen | Conocimiento |
|---|---|---|---|
| DeToditoOutlet (Rachel) | 221 (218 activos) | `public.productos` de la tienda DTO | 7 entradas desde detoditooutlet.cl/legal |
| Muebles y Hogar Molina | 194 | API pública de WooCommerce de mueblesyhogarmolina.cl | 3 entradas |

## Cómo busca la IA en el catálogo

`momo.products.search` es una columna de búsqueda de texto en español (nombre > categoría > descripción) con índice GIN. La herramienta `search_catalog` del agente hará:

```sql
select name, price_clp, sale_price_clp, dimensions, source_url
from momo.products,
     websearch_to_tsquery('spanish', :consulta_del_cliente) q
where organization_id = :empresa and active and search @@ q
order by ts_rank(search, q) desc
limit 5;
```

Prueba real: "cocina horno" devuelve el *Mueble de cocina L con horno, encimera 4 quemadores y lavaplatos* ($579.990, oferta $539.990) y las *Cocinas full equipo* ($549.990, oferta $519.990).

## Actualizar el catálogo de Molina (WooCommerce)

1. Pedir las páginas (la base de datos las descarga con `pg_net`):
   ```sql
   select net.http_get('https://mueblesyhogarmolina.cl/wp-json/wc/store/v1/products?per_page=100&page=' || p)
   from generate_series(1, 2) p;  -- devuelve los request_id
   ```
2. Unos segundos después, insertar o actualizar (reemplaza los `id` por los `request_id` obtenidos):
   ```sql
   with raw as (
     select jsonb_array_elements(content::jsonb) p
     from net._http_response where id in (/* request_id */) and status_code = 200
   )
   insert into momo.products (organization_id, name, category, description, price_clp, sale_price_clp,
                              image_url, source, source_id, source_url, in_stock, synced_at)
   select o.id, p->>'name', p->'categories'->0->>'name',
          regexp_replace(p->>'short_description', '<[^>]+>', ' ', 'g'),
          (p->'prices'->>'regular_price')::int,
          nullif(nullif(p->'prices'->>'sale_price', ''), p->'prices'->>'regular_price')::int,
          p->'images'->0->>'src', 'woocommerce', p->>'id', p->>'permalink', (p->>'is_in_stock')::boolean, now()
   from raw cross join (select id from momo.organizations where slug = 'muebles-hogar-molina') o
   on conflict (organization_id, source, source_id) do update
     set price_clp = excluded.price_clp, sale_price_clp = excluded.sale_price_clp,
         in_stock = excluded.in_stock, synced_at = now();
   ```

Próximo paso: convertir esto en una sincronización automática diaria (cron) para que los precios de la IA estén siempre al día.

## Conocimiento cargado (DTO)

Quiénes somos · Despacho (solo RM, costo según comuna, sin armado) · Retiro en Tupungato 9059, La Granja (lun–sáb 9:30–18:30) · Cómo comprar y medios de pago · Muebles personalizados (imagen JPG/PNG, 1–3 días hábiles tras aprobar) · Garantía y devoluciones (garantía legal 6 meses, retracto 10 días salvo personalizados, disconformidad 30 días en estándar) · Contacto (WhatsApp +56 9 3171 9740, redes@detoditooutlet.cl).

El asistente "Asistente Ventas DTO" tiene instrucciones para no inventar precios, no confirmar stock ni costo de despacho como definitivos y derivar a Rachel cuando el cliente quiere pagar, reclama o pide algo fuera del catálogo.
