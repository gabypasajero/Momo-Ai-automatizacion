/** Clave pública para los avisos al teléfono (Web Push). Es pública por diseño: la privada vive solo en el servidor. */
export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  || 'BGWtCD6I53GTOXdzCYgds-8ecOn6D1qRJA_Dn-Z0kQfBnGLf82hRUYk8HlvtNNtSsO2-PDMVhl9x1rdJN1aUaSc'

export const isPushServerReady = () => Boolean(process.env.VAPID_PRIVATE_KEY && process.env.MOMO_AVISOS_SECRET)
