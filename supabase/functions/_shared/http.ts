import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

export const SITE_URL = (Deno.env.get('SITE_URL') ?? 'http://localhost:5173').replace(/\/$/, '')

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/** Cliente con service role: solo existe dentro de las Edge Functions. */
export function serviceClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const text = await req.text()
    if (text.length > 200_000) return null
    const body = JSON.parse(text)
    return body && typeof body === 'object' && !Array.isArray(body) ? body : null
  } catch {
    return null
  }
}

async function hashedIp(req: Request): Promise<string> {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'desconocida'
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip))
  return Array.from(new Uint8Array(digest)).slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Límite por IP (guardada como hash). Devuelve false si se superó. */
export async function rateLimit(db: SupabaseClient, req: Request, action: string, max: number, windowSeconds: number) {
  const { data, error } = await db.rpc('check_rate_limit', {
    p_key: `${action}:${await hashedIp(req)}`,
    p_max: max,
    p_window_seconds: windowSeconds,
  })
  return error ? true : data === true
}

/** Valida el JWT del administrador y que tenga perfil en admin_profiles. */
export async function requireAdmin(req: Request, db: SupabaseClient): Promise<{ id: string; email: string } | null> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data, error } = await db.auth.getUser(token)
  if (error || !data.user) return null
  const { data: profile } = await db.from('admin_profiles').select('user_id').eq('user_id', data.user.id).maybeSingle()
  return profile ? { id: data.user.id, email: data.user.email ?? '' } : null
}
