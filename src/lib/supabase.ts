import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createOfflineSupabaseClient, isOfflineMode, localDemoCredentials } from '@/lib/offlineDb'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const hasRealSupabase = Boolean(url && anonKey)

/** true cuando el proyecto tiene sus variables de Supabase configuradas. */
export const isBackendConfigured = hasRealSupabase || isOfflineMode()
export const isDemoBackend = !hasRealSupabase

// Solo se usa la anon key (pública por diseño). La service role nunca llega al navegador.
export const supabase: SupabaseClient | null = hasRealSupabase ? createClient(url!, anonKey!) : createOfflineSupabaseClient() as unknown as SupabaseClient

export const BACKEND_MISSING =
  'El servicio aún no está configurado. Escríbenos por WhatsApp mientras lo activamos.'

export const DEMO_CREDENTIALS = localDemoCredentials

/** Devuelve el cliente o lanza un error legible si falta la configuración. */
export function db(): SupabaseClient {
  if (!supabase) throw new Error(BACKEND_MISSING)
  return supabase
}

/** Invoca una Edge Function y devuelve su JSON; convierte los errores del backend en mensajes legibles. */
export async function callFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await db().functions.invoke(name, { body })
  if (error) {
    let message = 'No pudimos completar la operación. Inténtalo nuevamente.'
    const response = (error as { context?: Response }).context
    try {
      const payload = await response?.json()
      if (payload?.error) message = String(payload.error)
    } catch { /* respuesta sin JSON */ }
    throw new Error(message)
  }
  return data as T
}

export { isOfflineMode }
