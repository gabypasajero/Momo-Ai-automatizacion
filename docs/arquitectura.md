# Arquitectura de Momo AI

## Stack

| Capa | Tecnología | Motivo |
|---|---|---|
| App web y API | **Next.js 15** (App Router, server actions) + **TypeScript** | Interfaz y backend en un solo proyecto, desplegado en Vercel |
| Estilos | **Tailwind CSS** con variables de marca | Identidad DTO centralizada; permite marca blanca por empresa |
| Base de datos y autenticación | **Supabase** (Postgres + Auth + Edge Functions) | Separación por empresa con seguridad por fila (RLS) |
| Cuentas y equipos | Edge Function **`momo-usuarios`** (service_role) | Crear cuentas con contraseña temporal y aplicar las reglas de roles sin exponer la clave secreta |
| IA | API de Claude (`claude-opus-5-5`) con herramientas | Momo vendedor (sugiere respuestas) y Momo interno (ayuda al equipo) |
| Canales | Marketplace en modo copiloto (registro manual + extensión de Chrome); Messenger/WhatsApp/Instagram por API de Meta (próximo) | Facebook no permite leer los chats de Marketplace de un perfil personal |

## Concepto del panel (propio, con identidad DTO)

Cinco secciones con nombres simples, y la venta vive dentro de la conversación (sin Kanban):

| Sección | Ruta | Qué hace |
|---|---|---|
| Hoy | `/hoy` | Frase de Momo con lo que pasó, quién te espera, ventas de la semana, duda pendiente de Momo |
| Conversaciones | `/conversaciones` | Bandeja con filtros (Te esperan, Momo atiende, Vendidas, Todas, Archivadas), chat, sugerencia de Momo y panel **Esta venta** (Pregunta → Cotizado → Pagado → Despachado, producto, despacho, Área de Diseño, venta perdida) |
| Clientes | `/clientes`, `/clientes/[id]` | Lista, ficha con compras y conversaciones, edición, exportación CSV (`/clientes/exportar`) |
| Lo que Momo sabe | `/conocimiento?t=` | Políticas, productos, dudas y personalidad (con "Probar a Momo") |
| Resultados | `/resultados?p=7|30|90` | Vendido, conversión, % respondido por Momo, ventas por día, canales, motivos de pérdida, costo de IA |
| Ajustes | `/ajustes?t=` | Mi perfil y contraseña, Empresa (contactos de derivación), Equipo, Plan (solicitudes) y Canales |

En celular hay una barra inferior (Hoy, Chats, Clientes, Más) y Momo aparece como botón flotante.

**Área de administración de la plataforma** (`/admin`): diseño propio, solo para `momo.platform_admins` y con contraseña propia del panel (30 minutos, bloqueo tras 5 intentos). Empresas (crear, editar plan/estado, equipo, restablecer contraseñas), Solicitudes, Consumo de IA y Seguridad.

## Estructura de carpetas

```
src/
├── app/
│   ├── (app)/                Panel de cada empresa (requiere sesión y empresa)
│   │   ├── hoy/ conversaciones/ clientes/ conocimiento/ resultados/ ajustes/ buscar/ mas/
│   │   ├── layout.tsx        Menú lateral, barra inferior, aviso de contraseña temporal, Momo
│   │   └── loading.tsx · error.tsx
│   ├── admin/                Área exclusiva del dueño de la plataforma (layout propio)
│   ├── api/asistente/        Momo interno (chat de ayuda)
│   ├── login/ recuperar/ restablecer/ auth/callback/
│   └── globals.css           Variables de marca DTO
├── components/
│   ├── ui/                   Button, Card, Badge, Modal, ActionForm, ConfirmAction, campos, Tabs…
│   ├── layout/               Sidebar, BottomNav, OrgSwitcher
│   └── brand/                Mascota Momo (SVG)
├── features/                 Un módulo por carpeta: queries.ts (lectura) + actions.ts (server actions) + componentes
│   ├── conversaciones/ hoy/ clientes/ conocimiento/ resultados/ ajustes/ admin/ auth/ assistant/
├── config/                   plans.ts, sales.ts (canales, pasos, roles), navigation.ts
└── lib/
    ├── session.ts            getSession(): usuario, empresa activa (cookie) y rol
    ├── actions.ts            Utilidades de server actions (roles, errores en español, lectura de formularios)
    ├── accounts.ts           Llamadas a la función momo-usuarios
    ├── ai/                   runtime (consumo y costos), catálogo, Momo vendedor, Momo interno
    └── supabase/             Clientes de servidor y middleware
supabase/
├── migrations/               Esquema completo (aplicado en el proyecto)
├── functions/momo-usuarios/  Edge Function de cuentas y equipos
└── manual/                   SQL opcional para ejecutar a mano
legacy/panel-v1/              Primer panel (tipo Vambe), archivado
extension/                    Extensión de Chrome (también en public/momo-extension.zip)
```

## Principios

1. **Cada botón hace algo real.** Las acciones son server actions que validan el rol, escriben en Supabase y refrescan la pantalla. Lo que todavía no existe (conexión con Meta) se ofrece como *solicitud* que llega al panel de administración, nunca como botón muerto.
2. **Seguridad en la base de datos.** Toda tabla lleva `organization_id` con RLS; triggers impiden apuntar a datos de otra empresa; el plan y el estado de una empresa y el equipo no se pueden editar desde la app (permisos por columna): solo por funciones con reglas.
3. **Una fuente de verdad.** Planes, canales, pasos de venta y roles viven en `src/config/`.
4. **Marca por variables.** Los componentes usan nombres según su función (`brand`, `accent`, `success`…).
5. **Accesible y para celular.** Etiquetas asociadas, foco visible, objetivos táctiles de 44 px, sin desborde horizontal, nada se abre en ventanas nuevas.

## Base de datos

Esquema `momo` (`supabase/migrations/`):

- **Empresas y equipo:** `organizations` (plan, estado, contactos de derivación), `members` (owner/admin/agent/viewer), `platform_admins`.
- **Ventas:** `contacts`, `conversations` (canal, resumen del último mensaje), `messages`, `tickets` (paso, Área de Diseño, producto, despacho, notas, motivo de pérdida).
- **Conocimiento:** `products`, `knowledge_entries`, `knowledge_gaps` (dudas que Momo no supo responder), `ai_assistants` (instrucciones).
- **Operación:** `requests` (plan, canal, soporte), `ai_usage` (tokens y costo por respuesta), `usage_events`, `webhook_events`.
