// Email marketing del panel administrativo. Requiere sesión de administrador.
// Acciones: config · preview · test · send
import { corsHeaders, json, readJson, requireAdmin, serviceClient } from '../_shared/http.ts'
import { buildMarketingEmail, DEMO_RECIPIENT, getEmailConfig, isEmailConfigured, sendTestEmail } from '../_shared/email.ts'
import { dispatchCampaign } from '../_shared/campaigns.ts'
import { filterEligibleRecipients } from '../_shared/rules.ts'
import { sanitizeEmailHtml } from '../_shared/sanitize.ts'

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)

  const db = serviceClient()
  const admin = await requireAdmin(req, db)
  if (!admin) return json({ error: 'No autorizado.' }, 401)

  const body = await readJson(req)
  if (!body) return json({ error: 'Solicitud inválida.' }, 400)
  const config = await getEmailConfig(db)
  const subject = str(body.subject, 200)
  const html = sanitizeEmailHtml(str(body.html, 100_000))
  const commercial = body.kind !== 'operativa'

  switch (body.action) {
    case 'config':
      return json({
        configured: isEmailConfigured(config),
        sender_email: config.from,
        sender_name: config.senderName,
        test_recipients: [...new Set([admin.email, config.adminEmail].filter(Boolean))],
      })

    case 'preview': {
      // Misma plantilla que el envío real, con datos demostrativos y enlace de baja de ejemplo.
      const mail = buildMarketingEmail(subject, html, { ...DEMO_RECIPIENT, unsubscribe_token: 'vista-previa' }, commercial)
      return json({ subject: mail.subject, html: mail.html })
    }

    case 'test': {
      const to = str(body.to, 254).toLowerCase()
      const allowed = [admin.email, config.adminEmail].filter(Boolean).map((e) => e!.toLowerCase())
      if (!allowed.includes(to)) return json({ error: 'Solo puedes enviar pruebas a un correo de administrador autorizado.' }, 403)
      if (!subject || !html) return json({ error: 'Completa el asunto y el contenido.' }, 400)
      const result = await sendTestEmail(config, { to, subject, html, senderName: str(body.sender_name, 80) || undefined, commercial })
      return result.ok ? json({ ok: true }) : json({ error: explain(result.error) }, 502)
    }

    case 'send': {
      const campaignId = str(body.campaign_id, 40)
      const ids = (Array.isArray(body.contact_ids) ? body.contact_ids : []).filter((v) => typeof v === 'string').slice(0, 2000)
      const { data: campaign } = await db.from('campaigns').select('*').eq('id', campaignId).single()
      if (!campaign) return json({ error: 'Campaña no encontrada.' }, 404)
      if (campaign.status !== 'borrador') return json({ error: 'Esta campaña ya fue enviada o programada.' }, 409)
      if (ids.length === 0) return json({ error: 'Selecciona al menos un destinatario.' }, 400)

      const { data: contacts } = await db.from('contact_directory')
        .select('id, email, first_name, last_name, marketing_consent, inquiries_count, orders_count').in('id', ids)
      const candidates = (contacts ?? []).map((c) => ({ ...c, has_relationship: c.inquiries_count + c.orders_count > 0 }))
      const { eligible, excluded } = filterEligibleRecipients(campaign.kind, candidates)
      if (eligible.length === 0) {
        return json({ error: 'Ningún destinatario seleccionado cumple las condiciones de esta campaña.' }, 400)
      }

      const scheduledAt = str(body.scheduled_at, 40)
      const scheduled = scheduledAt && new Date(scheduledAt).getTime() > Date.now() + 60_000
      await db.from('campaign_recipients').insert(
        eligible.map((c) => ({ campaign_id: campaignId, contact_id: c.id, email: c.email })))
      await db.from('campaigns').update({
        html: sanitizeEmailHtml(campaign.html),
        recipients_count: eligible.length,
        status: scheduled ? 'programada' : 'enviando',
        scheduled_at: scheduled ? new Date(scheduledAt).toISOString() : null,
      }).eq('id', campaignId)

      if (scheduled) return json({ status: 'programada', recipients: eligible.length, excluded: excluded.length })
      const result = await dispatchCampaign(db, config, campaignId)
      if ('error' in result) return json({ error: result.error }, 502)
      return json({ ...result, recipients: eligible.length, excluded: excluded.length })
    }

    default:
      return json({ error: 'Acción no reconocida.' }, 400)
  }
})

function explain(error: string) {
  return error === 'email_no_configurado'
    ? 'El servicio de email no está configurado (RESEND_API_KEY y remitente).'
    : `El proveedor de email rechazó el envío: ${error}`
}
