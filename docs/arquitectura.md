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

## Próximo: backend

1. Esquema en Supabase: `organizations`, `members`, `channel_accounts`, `contacts`, `conversations`, `messages`, `pipelines`, `pipeline_stages`, `tickets`, `ai_assistants`, `usage_events`, con RLS.
2. Autenticación (Supabase Auth) y protección de las rutas de `(app)`.
3. `POST /api/webhooks/meta`: verificación de firma, guardado del mensaje y encolado.
4. Agente de IA con herramientas: `reply`, `move_ticket`, `handoff_to_human`, `search_catalog`.
5. `SupabaseRepository` que reemplaza a `mockRepository`.
