// Servicio de email. La API key vive solo en los secrets de las Edge Functions.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { SITE_URL } from './http.ts'
import { renderVariables } from './rules.ts'
import { sanitizeEmailHtml } from './sanitize.ts'
import { emailLayout, styleContent } from './templates.ts'

export interface EmailConfig {
  apiKey: string | null
  from: string | null
  senderName: string
  adminEmail: string | null
  whatsapp: string | null
}

export async function getEmailConfig(db: SupabaseClient): Promise<EmailConfig> {
  const { data } = await db.from('site_settings').select('key, value')
    .in('key', ['sender_name', 'sender_email', 'admin_email', 'whatsapp_number'])
  const s = Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Record<string, string | null>
  return {
    apiKey: Deno.env.get('RESEND_API_KEY') ?? null,
    from: s.sender_email || Deno.env.get('EMAIL_FROM') || null,
    senderName: s.sender_name || 'Dulce Momento',
    adminEmail: s.admin_email || null,
    whatsapp: s.whatsapp_number || null,
  }
}

export const isEmailConfigured = (c: EmailConfig) => Boolean(c.apiKey && c.from)

interface SendInput {
  to: string
  subject: string
  html: string
  senderName?: string
  replyTo?: string | null
  headers?: Record<string, string>
}
type SendResult = { ok: true; id: string } | { ok: false; error: string }

async function deliver(config: EmailConfig, input: SendInput): Promise<SendResult> {
  if (!isEmailConfigured(config)) return { ok: false, error: 'email_no_configurado' }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${input.senderName ?? config.senderName} <${config.from}>`,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        reply_to: input.replyTo ?? undefined,
        headers: input.headers,
      }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, error: String(body?.message ?? `HTTP ${res.status}`).slice(0, 300) }
    return { ok: true, id: String(body.id) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'error_de_red' }
  }
}

interface LogContext {
  kind: 'transaccional' | 'campana' | 'automatizacion'
  contactId?: string | null
  campaignId?: string | null
}

async function logEvent(db: SupabaseClient, ctx: LogContext, input: SendInput, result: SendResult) {
  await db.from('email_events').insert({
    contact_id: ctx.contactId ?? null,
    campaign_id: ctx.campaignId ?? null,
    email: input.to,
    kind: ctx.kind,
    type: result.ok ? 'sent' : 'failed',
    subject: input.subject,
    provider_message_id: result.ok ? result.id : null,
    meta: result.ok ? {} : { error: result.error },
  })
}

/** Confirmaciones y avisos ligados a una consulta o pedido. No requiere consentimiento de marketing. */
export async function sendTransactionalEmail(
  db: SupabaseClient, config: EmailConfig, input: SendInput, contactId?: string | null,
): Promise<SendResult> {
  const result = await deliver(config, input)
  if (contactId) await logEvent(db, { kind: 'transaccional', contactId }, input, result)
  return result
}

export interface Personalization {
  first_name: string
  last_name: string
  email: string
  unsubscribe_token?: string
}

/** Arma el correo final (variables + plantilla) a partir del contenido del editor. */
export function buildMarketingEmail(subject: string, html: string, p: Personalization, commercial: boolean) {
  const vars = { nombre: p.first_name, apellido: p.last_name, correo: p.email, site_url: SITE_URL }
  const body = styleContent(renderVariables(sanitizeEmailHtml(html), vars))
  const unsubscribeUrl = commercial && p.unsubscribe_token ? `${SITE_URL}/baja?token=${p.unsubscribe_token}` : undefined
  return {
    subject: renderVariables(subject, vars).slice(0, 200),
    html: emailLayout({
      body,
      unsubscribeUrl,
      footerNote: commercial
        ? 'Recibes este correo porque aceptaste recibir novedades de Dulce Momento.'
        : undefined,
    }),
    unsubscribeUrl,
  }
}

/** Envío a un destinatario de una campaña o automatización. Registra el evento. */
export async function sendCampaignEmail(
  db: SupabaseClient,
  config: EmailConfig,
  args: {
    subject: string; html: string; senderName?: string; commercial: boolean
    recipient: Personalization & { id: string }
    campaignId?: string | null
    kind: 'campana' | 'automatizacion'
  },
): Promise<SendResult> {
  const mail = buildMarketingEmail(args.subject, args.html, args.recipient, args.commercial)
  const input: SendInput = {
    to: args.recipient.email,
    subject: mail.subject,
    html: mail.html,
    senderName: args.senderName,
    headers: mail.unsubscribeUrl ? { 'List-Unsubscribe': `<${mail.unsubscribeUrl}>` } : undefined,
  }
  const result = await deliver(config, input)
  await logEvent(db, { kind: args.kind, contactId: args.recipient.id, campaignId: args.campaignId }, input, result)
  return result
}

/** Copia de prueba para el administrador. No se registra como envío a clientes. */
export function sendTestEmail(
  config: EmailConfig, args: { to: string; subject: string; html: string; senderName?: string; commercial: boolean },
): Promise<SendResult> {
  const mail = buildMarketingEmail(args.subject, args.html, DEMO_RECIPIENT, false)
  return deliver(config, { to: args.to, subject: `[PRUEBA] ${mail.subject}`, html: mail.html, senderName: args.senderName })
}

// Datos demostrativos, claramente identificados, para vista previa y pruebas.
export const DEMO_RECIPIENT: Personalization = {
  first_name: 'María (dato demostrativo)',
  last_name: 'López (dato demostrativo)',
  email: 'correo.demostrativo@ejemplo.com',
}
