# Momo AI — CRM omnicanal con IA para vender por redes sociales

Frontend navegable (React + Vite + Tailwind + lucide-react) del SaaS de automatización de ventas por WhatsApp, Instagram, Messenger y TikTok.

## Vistas incluidas
- **Inicio**: resumen del día y tickets que requieren a un humano.
- **Embudo**: Kanban con arrastrar y soltar, filtros por canal, buscador, estados (abiertos/todos/cerrados), totales en CLP y vista de lista.
- **Chat**: bandeja omnicanal de 3 columnas con filtros, respuesta manual y pausar/activar IA por conversación.
- **Asistente**: gestor de asistentes de IA (crear, buscar).
- **Canales**: cuentas conectadas y asociación de canales a embudos.
- **Analítica**: KPIs, cobertura de IA, heatmap por horario, ruta del ticket (Sankey) y dona IA vs humano.
- **CRM**: tabla de clientes.
- **Ajustes → Plan y facturación**: planes en CLP para vender la plataforma.

 (mock). Aún no hay backend: el siguiente paso es Supabase (base de datos, autenticación y separación por empresa) más los webhooks de Meta y el agente de IA.

## Desarrollo
```bash
npm install
npm run dev
```

## Desplegar en Vercel
Importa el repositorio; Vercel detecta Vite automáticamente (build `npm run build`, salida `dist`).

El prototipo estático anterior quedó en `legacy/`.
