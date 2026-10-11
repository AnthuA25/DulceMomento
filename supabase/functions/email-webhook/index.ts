// Webhook del proveedor de email (Resend). Registra eventos reales de entrega,
// apertura, clic y rebote. Verifica la firma (formato Svix) antes de aceptar nada.
import { json, serviceClient } from '../_shared/http.ts'

const EVENT_TYPES: Record<string, string> = {
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
}

async function verify(req: Request, payload: string): Promise<boolean> {
  const secret = Deno.env.get('RESEND_WEBHOOK_SECRET')
  const id = req.headers.get('svix-id'), timestamp = req.headers.get('svix-timestamp')
  const signatures = req.headers.get('svix-signature')
  if (!secret || !id || !timestamp || !signatures) return false
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false

  const keyBytes = Uint8Array.from(atob(secret.replace(/^whsec_/, '')), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${payload}`))
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)))
  return signatures.split(' ').some((s) => s.split(',')[1] === expected)
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)
  const payload = await req.text()
  if (!(await verify(req, payload))) return json({ error: 'Firma inválida.' }, 401)

  const event = JSON.parse(payload)
  const type = EVENT_TYPES[event?.type]
  const messageId = event?.data?.email_id
  if (!type || !messageId) return json({ ignored: true })

  const db = serviceClient()
  // El evento "sent" original indica a qué contacto y campaña pertenece el mensaje.
  const { data: origin } = await db.from('email_events').select('contact_id, campaign_id, email, kind, subject')
    .eq('provider_message_id', messageId).eq('type', 'sent').limit(1).maybeSingle()
  if (!origin) return json({ ignored: true })

  await db.from('email_events').insert({
    ...origin,
    type,
    provider_message_id: messageId,
    meta: type === 'clicked' ? { link: event.data?.click?.link ?? null } : {},
  })
  return json({ ok: true })
})
