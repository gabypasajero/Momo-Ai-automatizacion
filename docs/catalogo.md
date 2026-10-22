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

## Modelo de negocio (lo que Momo debe saber)

- **Somos fabricantes.** Muebles y Hogar Molina SpA fabrica todo; De Todito Outlet es su canal de venta (Rachel) y usa el mismo catálogo.
- **Todo está siempre disponible:** se fabrica a pedido. La IA nunca dice "agotado".
- **Personalizados:** siempre disponibles; el diseño se aplica con adhesivo ploteado. Para clósets y cómodas, la IA invita a usar el diseñador de detoditooutlet.cl ("Diseñar ahora").
- **A medida y fuera de catálogo** (ej. muebles de cocina a medida): la IA reúne medidas, color, comuna y foto, mueve el ticket a la etapa `custom` y **deriva siempre** al **Área de Diseño (+56 9 5746 4151)** o a **Rachel (+56 9 3171 9740)**. Nunca da precio de un proyecto a medida.
- Palabras del dueño: *"Ahora somos versátiles: podemos fabricar lo que el cliente desea, siempre que esté al alcance de la empresa."*

## Conocimiento cargado

| Entrada | DTO | Molina |
|---|---|---|
| Quiénes somos (fabricantes) | ✔ | ✔ |
| Disponibilidad (fabricación a pedido) | ✔ | ✔ |
| Muebles personalizados con diseño | ✔ | ✔ |
| Diseñador online | ✔ | ✔ |
| Proyectos a medida y área de diseño | ✔ | ✔ |
| Despacho · Retiro y horario · Cómo comprar · Garantía y devoluciones · Contacto | ✔ | Retiro y garantía |

Pendiente: **tabla de costos de despacho por comuna** (la entrega el equipo). Con ella la IA podrá cotizar el total.

## Búsqueda por diseño

Los productos personalizables de DTO incluyen el nombre del diseño en su descripción ("Diseño: Spidey and his amazing friends"), así que un cliente que busca "spidey" encuentra la *Cocina infantil · Diseño 06*.
