// Baja de comunicaciones comerciales desde el enlace incluido en cada correo.
import { corsHeaders, json, rateLimit, readJson, serviceClient } from '../_shared/http.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)

  const body = await readJson(req)
  const token = typeof body?.token === 'string' ? body.token : ''
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return json({ error: 'El enlace no es válido.' }, 400)
  }

  const db = serviceClient()
  if (!(await rateLimit(db, req, 'unsubscribe', 10, 600))) return json({ error: 'Inténtalo nuevamente en unos minutos.' }, 429)

  const { data, error } = await db.rpc('unsubscribe_contact', { p_token: token })
  if (error) return json({ error: 'No pudimos procesar tu solicitud.' }, 500)
  return data ? json({ ok: true }) : json({ error: 'El enlace no es válido.' }, 404)
})
