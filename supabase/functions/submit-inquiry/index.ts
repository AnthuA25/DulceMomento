// Formulario de contacto y Dulce Bot:
// validación → contacto → consulta → email de confirmación → notificación interna.
import { corsHeaders, json, rateLimit, readJson, serviceClient, SITE_URL } from '../_shared/http.ts'
import { getEmailConfig, sendTransactionalEmail } from '../_shared/email.ts'
import { validateInquiry } from '../_shared/rules.ts'
import { inquiryConfirmationEmail, inquiryInternalEmail } from '../_shared/templates.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)

  const body = await readJson(req)
  if (!body) return json({ error: 'Solicitud inválida.' }, 400)
  // Honeypot: un campo oculto que las personas no completan.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return json({ error: 'No pudimos procesar tu consulta.' }, 400)
  }

  const parsed = validateInquiry(body)
  if (!parsed.ok) return json({ error: parsed.error }, 400)

  const db = serviceClient()
  if (!(await rateLimit(db, req, 'inquiry', 5, 600))) {
    return json({ error: 'Recibimos varias consultas seguidas. Inténtalo nuevamente en unos minutos.' }, 429)
  }

  const { data, error } = await db.rpc('submit_inquiry', { p: parsed.data })
  if (error || !data) {
    console.error('submit_inquiry', error?.message)
    return json({ error: 'No pudimos registrar tu consulta. Inténtalo nuevamente.' }, 500)
  }

  const mail = {
    ...data,
    inquiry_type: parsed.data.inquiry_type as string,
    message: (parsed.data.message as string) || null,
    source: parsed.data.source as string,
  }
  const config = await getEmailConfig(db)

  const confirmation = inquiryConfirmationEmail(mail, SITE_URL, config.whatsapp)
  const sent = await sendTransactionalEmail(db, config, { to: mail.email, ...confirmation, replyTo: config.adminEmail }, mail.contact_id)
  if (!sent.ok) console.error('confirmation_email', sent.error)

  if (config.adminEmail) {
    const internal = inquiryInternalEmail(mail, SITE_URL)
    const notified = await sendTransactionalEmail(db, config, { to: config.adminEmail, ...internal, replyTo: mail.email })
    if (!notified.ok) console.error('internal_email', notified.error)
  }

  return json({
    request_code: mail.request_code,
    first_name: mail.first_name,
    last_name: mail.last_name,
    email: mail.email,
    phone: mail.phone,
    inquiry_type: mail.inquiry_type,
    product_name: mail.product_name,
    message: mail.message,
    email_sent: sent.ok,
  })
})
