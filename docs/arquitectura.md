# Arquitectura de Momo AI

## Stack

| Capa | Tecnología | Motivo |
|---|---|---|
| App web y API | **Next.js 15** (App Router) + **TypeScript** | La interfaz y el backend (webhooks, IA) en un solo proyecto, desplegado en Vercel |
| Estilos | **Tailwind CSS** con variables de marca | La paleta DTO es centralizada y permite marca blanca por empresa |
| Base de datos y autenticación | **Supabase** (Postgres + Auth + Realtime) | Separación por empresa con políticas de acceso por fila (RLS) y bandeja en tiempo real |
| Canales | Meta Messenger Platform → luego WhatsApp Cloud API, Instagram y TikTok | El piloto empieza con Facebook/Marketplace |
| IA | API de Claude con herramientas (function calling) | Responder, mover tickets y derivar a una persona |
| Cobros | Stripe / Mercado Pago | Planes en CLP (`src/config/plans.ts`) |

## Estructura de carpetas

```
src/
├── app/                      Rutas (una carpeta = una URL)
│   ├── (app)/                Panel con barra lateral (requiere sesión)
│   │   ├── inicio/ embudo/ chat/ asistentes/ crm/ canales/ analitica/
│   │   ├── ajustes/facturacion/
│   │   ├── [module]/         Módulos del roadmap (Servicio, Ecommerce…)
│   │   ├── layout.tsx        Barra lateral + submenú + encabezado
│   │   ├── loading.tsx       Esqueleto de carga
│   │   └── error.tsx         Pantalla de error con reintento
│   ├── api/                  (próximo) webhooks de Meta, IA, cobros
│   ├── layout.tsx            HTML raíz, fuente y metadatos
│   └── globals.css           Variables de marca DTO
├── components/
│   ├── ui/                   Piezas base reutilizables (Button, Card, Badge…)
│   └── layout/               Sidebar, SubNav, Topbar, ComingSoon
├── features/                 Un módulo de negocio por carpeta
│   ├── pipeline/             Embudo Kanban
│   ├── chat/                 Bandeja omnicanal
│   ├── analytics/            Dashboard y gráficos
│   ├── assistants/ channels/ crm/ billing/ home/
├── config/                   Navegación, canales y planes (fuente única)
└── lib/
    ├── data/                 Capa de datos
    │   ├── types.ts          Modelo de dominio
    │   ├── repository.ts     Contrato que usa la UI
    │   ├── mock.ts           Implementación de prueba
    │   └── index.ts          getRepository(): aquí se conecta Supabase
    ├── format.ts             Formato CLP, números y hora
    └── cn.ts                 Utilidad para combinar clases
```

## Principios

1. **Las pantallas no conocen la base de datos.** Las páginas (componentes de servidor) piden datos a `getRepository()` y se los pasan a los componentes de `features/`. Cambiar los datos de prueba por Supabase es implementar `Repository` una vez.
2. **Una fuente de verdad por concepto.** Planes, canales y navegación viven en `src/config/`; la página de precios, los límites del backend y el menú leen del mismo archivo.
3. **Marca por variables.** Los componentes usan nombres según su función (`brand`, `success`, `danger`…), no colores fijos. Cada empresa podrá tener su paleta cambiando las variables CSS.
4. **Separación por empresa desde el día 1.** Toda tabla lleva `organization_id` y una política RLS; ninguna consulta puede cruzar datos entre empresas.
5. **Accesibilidad.** Botones con `aria-label`, estados con `aria-pressed`/`aria-current`, y el foco visible.

## Base de datos (lista)

Esquema `momo` en el proyecto Supabase "DTO detoditooutlet" (`supabase/migrations/`). 15 tablas, todas con seguridad por fila (RLS):

- **Empresas y equipo:** `organizations`, `members` (roles owner/admin/agent/viewer), función `momo.has_role()`.
- **Canales:** `channel_accounts` (el token va a Supabase Vault, nunca en texto plano).
- **Clientes:** `contacts`, `contact_identities` (una persona puede escribir por varios canales).
- **Ventas:** `pipelines`, `pipeline_stages` (con `key` estable para la IA), `tickets`.
- **Mensajería:** `conversations` (incluye `last_inbound_at` para la ventana de 24 h de Meta), `messages` (con `external_id` único para no duplicar webhooks).
- **IA:** `products` (búsqueda de texto en español), `ai_assistants`, `knowledge_entries`.
- **Operación:** `usage_events` (límites por plan; solo el backend escribe), `webhook_events` (registro crudo de Meta; solo el backend).

Lectura para cualquier miembro, escritura para owner/admin/agent y borrado solo para owner/admin. Detalle del catálogo en [catalogo.md](catalogo.md).

> Para que la app lea el esquema `momo` con supabase-js hay que agregarlo en **Supabase → Project Settings → Data API → Exposed schemas**.

## Próximo: backend

1. ~~Esquema en Supabase~~ ✔
2. Autenticación (Supabase Auth) y protección de las rutas de `(app)`.
3. `POST /api/webhooks/meta`: verificación de firma, guardado del mensaje y encolado.
4. Agente de IA con herramientas: `reply`, `move_ticket`, `handoff_to_human`, `search_catalog`.
5. `SupabaseRepository` que reemplaza a `mockRepository`.
