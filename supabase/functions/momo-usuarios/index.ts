// Momo AI · gestión de cuentas y equipos (Supabase Edge Function)
//
// Corre con la clave service_role, que nunca sale del servidor. Toda acción valida primero la sesión
// de quien llama y sus permisos:
//   - Equipo de una empresa: el dueño gestiona a todos; un admin no puede nombrar ni tocar dueños;
//     nadie se cambia su propio rol ni se quita a sí mismo; siempre queda al menos un dueño.
//   - Administración de la plataforma: exige el panel de administración abierto (contraseña propia).
// Las cuentas nuevas reciben una contraseña temporal que deben cambiar al entrar.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const ROLES = ['owner', 'admin', 'agent', 'viewer'] as const
type Role = (typeof ROLES)[number]

// Usuarios incluidos en cada plan (null = sin límite). Debe coincidir con src/config/plans.ts.
const USER_LIMITS: Record<string, number | null> = { emprende: 2, pyme: 5, empresa: 15, corporativo: null }

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const db = admin.schema('momo')

class Fallo extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const isUuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v)
const isRole = (v: unknown): v is Role => typeof v === 'string' && (ROLES as readonly string[]).includes(v)

function temporaryPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return 'Momo-' + Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

async function roleIn(org: string, userId: string): Promise<Role | null> {
  const { data, error } = await db.from('members').select('role').eq('organization_id', org).eq('user_id', userId).maybeSingle()
  if (error) throw error
  return (data?.role as Role | undefined) ?? null
}

async function panelOpen(userId: string) {
  const { data, error } = await db.from('platform_admins').select('unlocked_until, locked_until').eq('user_id', userId).maybeSingle()
  if (error) throw error
  const now = Date.now()
  return !!data?.unlocked_until && Date.parse(data.unlocked_until) > now && !(data.locked_until && Date.parse(data.locked_until) > now)
}

async function ownersCount(org: string) {
  const { count, error } = await db.from('members').select('user_id', { count: 'exact', head: true }).eq('organization_id', org).eq('role', 'owner')
  if (error) throw error
  return count ?? 0
}

async function accountInfo(userId: string) {
  const { data } = await admin.auth.admin.getUserById(userId)
  return {
    email: data.user?.email ?? null,
    last_sign_in_at: data.user?.last_sign_in_at ?? null,
    must_change_password: data.user?.user_metadata?.debe_cambiar_clave === true,
  }
}

type Body = Record<string, unknown>

async function listTeam(callerId: string, body: Body) {
  const org = body.org
  if (!isUuid(org)) throw new Fallo(400, 'Empresa no válida')
  if (!(await roleIn(org, callerId)) && !(await panelOpen(callerId))) throw new Fallo(403, 'No tienes acceso a esta empresa')
  const { data, error } = await db.from('members').select('user_id, role, display_name, created_at').eq('organization_id', org)
  if (error) throw error
  const order: Record<string, number> = { owner: 0, admin: 1, agent: 2, viewer: 3 }
  const rows = await Promise.all((data ?? []).map(async (m) => ({ ...m, ...(await accountInfo(m.user_id)) })))
  rows.sort((a, b) => order[a.role] - order[b.role] || a.created_at.localeCompare(b.created_at))
  return { members: rows }
}

async function addMember(callerId: string, body: Body) {
  const { org, role } = body
  const email = String(body.email ?? '').trim().toLowerCase()
  const name = String(body.name ?? '').trim().slice(0, 80)
  if (!isUuid(org)) throw new Fallo(400, 'Empresa no válida')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Fallo(400, 'Escribe un correo válido')
  if (!isRole(role)) throw new Fallo(400, 'Rol no válido')

  const open = await panelOpen(callerId)
  const callerRole = await roleIn(org, callerId)
  const allowed = open || callerRole === 'owner' || (callerRole === 'admin' && role !== 'owner')
  if (!allowed) throw new Fallo(403, role === 'owner' ? 'Solo un dueño puede sumar a otro dueño' : 'No tienes permiso para sumar personas')

  const { data: company, error: orgError } = await db.from('organizations').select('plan').eq('id', org).maybeSingle()
  if (orgError) throw orgError
  if (!company) throw new Fallo(404, 'La empresa no existe')
  const limit = USER_LIMITS[company.plan] ?? null
  if (limit !== null && !open) {
    const { count } = await db.from('members').select('user_id', { count: 'exact', head: true }).eq('organization_id', org)
    if ((count ?? 0) >= limit) throw new Fallo(409, `Tu plan incluye ${limit} usuarios. Pide un plan mayor en Ajustes › Plan.`)
  }

  const { data: existingId, error: lookupError } = await db.rpc('user_id_by_email', { p_email: email })
  if (lookupError) throw lookupError

  let userId = existingId as string | null
  let password: string | null = null
  if (userId) {
    if (await roleIn(org, userId)) throw new Fallo(409, 'Esa persona ya es parte del equipo')
  } else {
    password = temporaryPassword()
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name || undefined, debe_cambiar_clave: true },
    })
    if (error || !data.user) throw new Fallo(400, 'No se pudo crear la cuenta: ' + (error?.message ?? 'error desconocido'))
    userId = data.user.id
  }

  const { error: insertError } = await db.from('members').insert({ organization_id: org, user_id: userId, role, display_name: name || null })
  if (insertError) throw insertError
  return { created: password !== null, password, email }
}

async function changeRole(callerId: string, body: Body) {
  const { org, user_id: target, role } = body
  if (!isUuid(org) || !isUuid(target)) throw new Fallo(400, 'Datos no válidos')
  if (!isRole(role)) throw new Fallo(400, 'Rol no válido')
  const open = await panelOpen(callerId)
  const callerRole = await roleIn(org, callerId)
  const targetRole = await roleIn(org, target)
  if (!targetRole) throw new Fallo(404, 'Esa persona no es parte del equipo')
  if (!open) {
    if (callerRole !== 'owner' && callerRole !== 'admin') throw new Fallo(403, 'No tienes permiso para cambiar roles')
    if (target === callerId) throw new Fallo(403, 'No puedes cambiar tu propio rol')
    if ((targetRole === 'owner' || role === 'owner') && callerRole !== 'owner') throw new Fallo(403, 'Solo un dueño puede nombrar o cambiar dueños')
  }
  if (targetRole === 'owner' && role !== 'owner' && (await ownersCount(org)) <= 1) throw new Fallo(409, 'La empresa debe tener al menos un dueño')
  const { error } = await db.from('members').update({ role }).eq('organization_id', org).eq('user_id', target)
  if (error) throw error
  return { ok: true }
}

async function removeMember(callerId: string, body: Body) {
  const { org, user_id: target } = body
  if (!isUuid(org) || !isUuid(target)) throw new Fallo(400, 'Datos no válidos')
  const open = await panelOpen(callerId)
  const callerRole = await roleIn(org, callerId)
  const targetRole = await roleIn(org, target)
  if (!targetRole) return { ok: true }
  if (!open) {
    if (callerRole !== 'owner' && callerRole !== 'admin') throw new Fallo(403, 'No tienes permiso para quitar personas')
    if (target === callerId) throw new Fallo(403, 'No puedes quitarte a ti mismo')
    if (targetRole === 'owner' && callerRole !== 'owner') throw new Fallo(403, 'Solo un dueño puede quitar a otro dueño')
  }
  if (targetRole === 'owner' && (await ownersCount(org)) <= 1) throw new Fallo(409, 'La empresa debe tener al menos un dueño')
  const { error } = await db.from('members').delete().eq('organization_id', org).eq('user_id', target)
  if (error) throw error
  return { ok: true }
}

async function updateMyName(callerId: string, body: Body) {
  const name = String(body.name ?? '').trim().slice(0, 80)
  if (name.length < 2) throw new Fallo(400, 'Escribe tu nombre')
  const { error } = await db.from('members').update({ display_name: name }).eq('user_id', callerId)
  if (error) throw error
  const { data } = await admin.auth.admin.getUserById(callerId)
  await admin.auth.admin.updateUserById(callerId, { user_metadata: { ...(data.user?.user_metadata ?? {}), full_name: name } })
  return { ok: true }
}

async function adminEmails(callerId: string, body: Body) {
  if (!(await panelOpen(callerId))) throw new Fallo(403, 'Panel cerrado')
  const ids = Array.isArray(body.user_ids) ? body.user_ids.filter(isUuid).slice(0, 200) : []
  const entries = await Promise.all([...new Set(ids)].map(async (id) => [id, await accountInfo(id)] as const))
  return { accounts: Object.fromEntries(entries) }
}

async function adminResetPassword(callerId: string, body: Body) {
  if (!(await panelOpen(callerId))) throw new Fallo(403, 'Panel cerrado')
  const target = body.user_id
  if (!isUuid(target)) throw new Fallo(400, 'Cuenta no válida')
  if (target === callerId) throw new Fallo(400, 'Cambia tu propia contraseña desde Ajustes')
  const { data, error } = await admin.auth.admin.getUserById(target)
  if (error || !data.user) throw new Fallo(404, 'La cuenta no existe')
  const password = temporaryPassword()
  const { error: updateError } = await admin.auth.admin.updateUserById(target, {
    password,
    user_metadata: { ...(data.user.user_metadata ?? {}), debe_cambiar_clave: true },
  })
  if (updateError) throw updateError
  return { password, email: data.user.email }
}

const ACTIONS: Record<string, (callerId: string, body: Body) => Promise<unknown>> = {
  equipo_listar: listTeam,
  equipo_agregar: addMember,
  equipo_rol: changeRole,
  equipo_quitar: removeMember,
  perfil_nombre: updateMyName,
  admin_correos: adminEmails,
  admin_restablecer: adminResetPassword,
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') throw new Fallo(405, 'Método no permitido')
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    if (!token) throw new Fallo(401, 'Sin sesión')
    const { data, error } = await admin.auth.getUser(token)
    if (error || !data.user) throw new Fallo(401, 'Sesión no válida')

    const body = (await req.json().catch(() => ({}))) as Body
    const action = ACTIONS[String(body.accion)]
    if (!action) throw new Fallo(400, 'Acción no válida')
    return json(await action(data.user.id, body))
  } catch (e) {
    if (e instanceof Fallo) return json({ error: e.message }, e.status)
    console.error('momo-usuarios', e)
    return json({ error: 'No se pudo completar la acción' }, 500)
  }
})
