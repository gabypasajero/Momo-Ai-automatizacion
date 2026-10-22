# Puesta en marcha con Supabase

La app tiene dos modos:

| Modo | Cuándo | Qué muestra |
|---|---|---|
| **Demo** | Faltan `NEXT_PUBLIC_SUPABASE_URL` o `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Datos de prueba, sin login |
| **Real** | Ambas variables definidas | Login obligatorio; cada usuario ve solo su empresa (RLS) |

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

1. Supabase → **Authentication → Users → Invite user** (o "Add user" con contraseña).
2. Asociarla a su empresa y rol (`owner`, `admin`, `agent` o `viewer`):

```sql
insert into momo.members (organization_id, user_id, role, display_name)
select o.id, u.id, 'owner', 'Rachel'
from momo.organizations o, auth.users u
where o.slug = 'detodito-outlet' and u.email = 'correo@ejemplo.cl';
```

Las cuentas de la tienda DTO (admins y vendedores) ya existen en este proyecto: basta el paso 2 para darles acceso a Momo.

## Cómo está armado

- `src/middleware.ts` refresca la sesión en cada request y envía al login a quien no la tenga.
- `src/lib/data/index.ts` → `getRepository()` elige `SupabaseRepository` o los datos de prueba, una vez por request.
- `src/lib/data/supabase.ts` traduce las tablas de `momo` al modelo de las pantallas y filtra por la empresa activa.
- `src/features/auth/` contiene el login (server action) y el cierre de sesión.
