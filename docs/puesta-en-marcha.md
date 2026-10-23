# Puesta en marcha con Supabase

La app necesita `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Sin ellas muestra un aviso para configurarlas.
Login obligatorio; cada persona ve solo las empresas a las que pertenece (RLS) y elige la activa en el menú.

## 1. Habilitar el esquema `momo` en la API (una vez, en el panel)

Supabase → proyecto **DTO detoditooutlet** → **Project Settings → Data API → Exposed schemas** → agregar `momo` → **Save**.

Sin esto la API responde `Invalid schema: momo` y las pantallas no cargan.

## 2. Variables de entorno

En Vercel (proyecto `momo-ai-automatizacion` → Settings → Environment Variables) y en `.env.local` para desarrollo:

```
NEXT_PUBLIC_SUPABASE_URL=https://bmxmqhbkgvgyqpwsuazm.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_C4bwkSAfBBHNg8z523_qpw_P-PDzciI
```

La clave publicable puede estar en el navegador: la seguridad la dan las políticas RLS.

## 3. Redirecciones de Auth

Supabase → **Authentication → URL Configuration → Redirect URLs**: agregar la URL de Momo en Vercel con `/auth/callback` (por ejemplo `https://momo-ai-automatizacion.vercel.app/auth/callback`) y `http://localhost:3000/auth/callback`.
No cambiar el **Site URL**: pertenece a la tienda DTO, que comparte el proyecto.

## 4. Dar acceso a una persona

Ya no se hace con SQL:

- **Dueño o administrador de una empresa:** Ajustes › Equipo › *Sumar persona*. Si el correo no tiene cuenta, se crea con una contraseña temporal que se muestra una sola vez; al entrar, Momo pide cambiarla.
- **Dueño de la plataforma:** Administración › Empresas › *Nueva empresa* (crea la empresa, su asistente y su dueño) o, dentro de una empresa, *Sumar persona* y *Crear contraseña temporal*.

Lo hace la Edge Function `momo-usuarios` (`supabase/functions/momo-usuarios`), que corre con la clave service_role del proyecto (Supabase la entrega automáticamente; no hay que configurar nada) y valida los permisos de quien llama.

## 4.1 Área de administración

`/admin` existe solo para las cuentas en `momo.platform_admins`. La primera vez pide crear una contraseña propia del panel (distinta a la de la cuenta). Se cierra a los 30 minutos y se bloquea 15 minutos tras 5 intentos fallidos.

## 4.2 Limpieza opcional

`supabase/manual/endurecer_equipo.sql` elimina una política antigua que ya no tiene efecto y dos funciones sin uso. Ejecútalo una vez en Supabase → SQL Editor.

## Cómo está armado

- `src/middleware.ts` refresca la sesión en cada request y envía al login a quien no la tenga.
- `src/lib/session.ts` → `getSession()` entrega usuario, empresa activa (cookie `momo_empresa`) y rol, una vez por request.
- Cada sección tiene `queries.ts` (lectura) y `actions.ts` (server actions con verificación de rol) en `src/features/`.
- `src/features/auth/` contiene ingreso, cierre de sesión, recuperación y cambio de contraseña.

## 5. Activar la inteligencia de Momo (asistente para vendedores)

Con la clave se activan:

- **Momo vendedor:** el botón *Sugerir respuesta* de cada conversación y *Probar a Momo* (Lo que Momo sabe › Personalidad). Usa las instrucciones, las políticas y el catálogo; lo que no sabe lo anota como duda.
- **Momo interno:** la mascota recorre el panel y al tocarla abre un chat de ayuda para el equipo. Sin clave funciona en **modo atajos**; con clave entiende preguntas y hace tareas:

- `buscar_productos`: precios y ofertas del catálogo de la empresa.
- `ver_conocimiento` / `agregar_conocimiento`: revisa y guarda políticas del negocio (pide confirmación antes de guardar).
- `ir_a`: lleva a una pantalla, siempre en la misma pestaña.

Para activarla:

1. Crea una clave en **console.anthropic.com → API Keys** (la cuenta necesita saldo o método de pago).
2. En Vercel → proyecto `momo-ai-automatizacion` → **Settings → Environment Variables**:
   `ANTHROPIC_API_KEY` = la clave, marcada como **Sensitive**, en Production y Preview. (Esta sí es secreta: nunca con prefijo `NEXT_PUBLIC_`.)
3. Vuelve a publicar (Deployments → ⋯ → Redeploy).

Detalles técnicos: `src/lib/ai/` (Tool Runner del SDK `@anthropic-ai/sdk`, modelo `claude-opus-5-5`, respaldo del servidor
ante rechazos). Cada respuesta registra tokens y costo en `momo.ai_usage`, visible en Resultados y en Administración › Consumo de IA.
