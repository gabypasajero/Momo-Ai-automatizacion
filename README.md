# Momo AI

CRM omnicanal con IA para vender por **Facebook (Messenger y Marketplace), WhatsApp, Instagram y TikTok**. Pensado para pymes, medianas y grandes empresas en Chile y Latinoamérica.

> Estado: la interfaz está completa y navegable, con datos de prueba. El backend (Supabase, webhooks de Meta y agente de IA) es la siguiente etapa. El piloto se hará con la venta por Facebook de Rachel: ver [docs/piloto-facebook.md](docs/piloto-facebook.md).

## Módulos
| Ruta | Módulo |
|---|---|
| `/inicio` | Resumen del día y tickets que necesitan a una persona |
| `/embudo` | Kanban de ventas con arrastrar y soltar, filtros por canal y totales en CLP |
| `/chat` | Bandeja omnicanal con pausa/activación de la IA por conversación |
| `/asistentes` | Asistentes de IA |
| `/crm` | Clientes |
| `/canales` | Cuentas conectadas y asociación de canales a embudos |
| `/analitica` | KPIs, cobertura de IA, mapa de calor, ruta del ticket, IA vs humano |
| `/ajustes/facturacion` | Planes en CLP |

## Desarrollo
```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm run build
```

Variables de entorno: copia `.env.example` como `.env.local` (todavía no son necesarias con los datos de prueba).

## Despliegue
Importa el repositorio en Vercel; detecta Next.js automáticamente.

## Documentación
- [Arquitectura y estructura de carpetas](docs/arquitectura.md)
- [Piloto con Facebook / Marketplace](docs/piloto-facebook.md)

## Marca
La paleta DTO (morado `#7565e8`, azul `#4f8df7`, tinta `#1d2433`) vive como variables CSS en `src/app/globals.css` y como colores semánticos en `tailwind.config.ts` (`brand`, `accent`, `ink`, `muted`, `line`, `surface`, `success`, `danger`, `warning`). Para dar marca blanca a una empresa basta con cambiar esas variables.

El prototipo estático original quedó en `legacy/`.
