// Reglas de negocio puras (sin dependencias) compartidas por las Edge Functions
// y cubiertas por las pruebas automáticas.

export type CampaignKind = 'comercial' | 'operativa'

export interface RecipientCandidate {
  id: string
  email: string
  first_name: string
  last_name: string
  marketing_consent: boolean
  /** Tiene al menos una consulta o un pedido registrado. */
  has_relationship: boolean
  unsubscribe_token?: string
}

/**
 * COMERCIAL: únicamente contactos con consentimiento de marketing.
 * OPERATIVA: únicamente contactos con una consulta o pedido vigente; no sirve
 * para saltarse el consentimiento porque el tipo lo fija el contenido de la campaña.
 */
export function filterEligibleRecipients<T extends RecipientCandidate>(kind: CampaignKind, contacts: T[]) {
  const eligible: T[] = []
  const excluded: T[] = []
  const seen = new Set<string>()
  for (const c of contacts) {
    const ok = kind === 'comercial' ? c.marketing_consent === true : c.has_relationship === true
    if (ok && !seen.has(c.email)) {
      seen.add(c.email)
      eligible.push(c)
    } else {
      excluded.push(c)
    }
  }
  return { eligible, excluded }
}

/** Reemplaza {{variable}} por su valor. Las variables desconocidas quedan vacías. */
export function renderVariables(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, key: string) => vars[key.toLowerCase()] ?? '')
}

export interface AutomationGuardInput {
  automationKey: string
  enabled: boolean
  requiresMarketingConsent: boolean
  marketingConsent: boolean
  paidOrders: number
  /** Estado del pago del pedido asociado (solo para pedido_pendiente). */
  orderPaymentStatus?: string | null
}

/** Decide si un paso se envía o si la inscripción debe detenerse, y por qué. */
export function automationGuard(i: AutomationGuardInput): { send: true } | { send: false; stop: string | null } {
  if (!i.enabled) return { send: false, stop: null }
  if (i.requiresMarketingConsent && !i.marketingConsent) return { send: false, stop: 'sin_consentimiento' }
  if (i.automationKey === 'lead_nurture' && i.paidOrders > 0) return { send: false, stop: 'compra_confirmada' }
  if (i.automationKey === 'pedido_pendiente' && i.orderPaymentStatus !== 'pendiente') {
    return { send: false, stop: 'pago_registrado' }
  }
  return { send: true }
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const INQUIRY_TYPES = ['cotizacion', 'keke_personalizado', 'pedido', 'delivery', 'otro']
const SOURCES = ['formulario', 'chatbot']

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/** Validación de backend del formulario / Dulce Bot. Devuelve los datos limpios o un error legible. */
export function validateInquiry(body: Record<string, unknown>):
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string } {
  const first_name = str(body.first_name)
  const email = str(body.email).toLowerCase()
  const phone = str(body.phone)
  const event_date = str(body.event_date)
  if (first_name.length < 2 || first_name.length > 80) return { ok: false, error: 'Ingresa tu nombre.' }
  if (str(body.last_name).length > 80) return { ok: false, error: 'El apellido es demasiado largo.' }
  if (!EMAIL_RE.test(email) || email.length > 254) return { ok: false, error: 'Ingresa un correo electrónico válido.' }
  if (phone && !/^[0-9+\s()-]{6,20}$/.test(phone)) return { ok: false, error: 'Ingresa un número de WhatsApp válido.' }
  if (!INQUIRY_TYPES.includes(str(body.inquiry_type))) return { ok: false, error: 'Selecciona el tipo de consulta.' }
  if (event_date && !/^\d{4}-\d{2}-\d{2}$/.test(event_date)) return { ok: false, error: 'La fecha no es válida.' }
  if (str(body.message).length > 2000) return { ok: false, error: 'El mensaje es demasiado largo.' }
  return {
    ok: true,
    data: {
      first_name,
      last_name: str(body.last_name),
      email,
      phone,
      inquiry_type: str(body.inquiry_type),
      product_id: str(body.product_id),
      event_type: str(body.event_type).slice(0, 60),
      event_date,
      quantity: str(body.quantity).slice(0, 60),
      message: str(body.message),
      source: SOURCES.includes(str(body.source)) ? str(body.source) : 'formulario',
      marketing_consent: body.marketing_consent === true,
    },
  }
}
