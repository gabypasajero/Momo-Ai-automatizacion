# Momo AI

Ventas por chat con IA para pymes: Momo sugiere cada respuesta con el catálogo y las políticas reales de la empresa,
y cada conversación lleva su venta al lado, de la pregunta al despacho. Piloto: De Todito Outlet (Marketplace de Facebook).

## Secciones
| Ruta | Sección |
|---|---|
| `/hoy` | Lo que pasó, quién te espera, ventas de la semana y lo que Momo aprendió |
| `/conversaciones` | Chats con la venta al lado (Pregunta → Cotizado → Pagado → Despachado), sugerencias de Momo y Área de Diseño |
| `/clientes` | Clientes con su historial de compras; exportación a Excel |
| `/conocimiento` | Políticas, productos, dudas por enseñar y personalidad de Momo (con prueba) |
| `/resultados` | Ventas, conversión, canales y costo de IA |
| `/ajustes` | Perfil y contraseña, empresa, equipo, plan y canales |
| `/admin` | Área exclusiva del dueño de la plataforma (contraseña propia) |
| `/login` · `/recuperar` · `/restablecer` | Acceso y recuperación de contraseña |

## Desarrollo
```bash
npm install
cp .env.example .env.local   # URL y clave publicable de Supabase
npm run dev                  # http://localhost:3000
npm run lint && npm run typecheck && npm run build
```

Puesta en marcha (Supabase, IA, cuentas): [docs/puesta-en-marcha.md](docs/puesta-en-marcha.md).

## Despliegue
Vercel (proyecto `momo-ai-automatizacion`): cada push a `main` publica producción; las demás ramas generan vistas previas.

## Extensión de Chrome
Burbuja con tus conversaciones y quién te espera en cualquier página (por ejemplo Marketplace). Se descarga desde Ajustes › Canales: ver [extension/README.md](extension/README.md).

## Documentación
- [Arquitectura y estructura de carpetas](docs/arquitectura.md)
- [Piloto con Facebook / Marketplace](docs/piloto-facebook.md)
- [Catálogo y conocimiento de la IA](docs/catalogo.md)
- Base de datos: `supabase/migrations/`, función `supabase/functions/momo-usuarios/` y SQL opcional en `supabase/manual/`

## Marca
Identidad de detoditooutlet.cl (rosa `#A8325E`, fondo `#FFF8F6`, tinta `#3A2A33`, verde `#1E7A4C`, lila `#5B3F95`; tipografías Nunito y Quicksand) como variables CSS en `src/app/globals.css` y colores semánticos en `tailwind.config.ts`. Para marca blanca basta con cambiar esas variables.

El primer panel (inspirado en Vambe) quedó archivado en `legacy/panel-v1/`; el prototipo estático original, en `legacy/`.
