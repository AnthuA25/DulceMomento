// Plantillas de correo (HTML puro, sin dependencias). El panel pide la vista previa
// a la Edge Function, así lo que se previsualiza es exactamente lo que se envía.
import { escapeHtml } from './sanitize.ts'

const C = { bg: '#FDF8F1', card: '#FFFDF8', line: '#F0E4D6', text: '#3B2418', soft: '#6B5145', brand: '#C4604D' }

const INQUIRY_TYPES: Record<string, string> = {
  cotizacion: 'Cotización',
  keke_personalizado: 'Keke personalizado',
  pedido: 'Pedido',
  delivery: 'Delivery',
  otro: 'Otra consulta',
}
const PAYMENT_METHODS: Record<string, string> = { yape: 'Yape', plin: 'Plin', transferencia: 'Transferencia bancaria' }
const PAYMENT_STATUS: Record<string, string> = {
  pendiente: 'Pendiente',
  en_verificacion: 'En verificación',
  pagado: 'Pagado',
  rechazado: 'Rechazado',
}

export const inquiryTypeLabel = (t: string) => INQUIRY_TYPES[t] ?? t
const money = (n: number) => `S/ ${Number(n).toFixed(2)}`

export function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0"><tr><td style="background:${C.brand};border-radius:999px"><a style="display:inline-block;padding:13px 26px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none" target="_blank" href="${escapeHtml(href)}">${escapeHtml(label)}</a></td></tr></table>`
}

/** Convierte los enlaces marcados como CTA en el editor en botones con el estilo de la marca. */
export function styleContent(html: string): string {
  return html
    .replace(/<a href="([^"]*)" data-cta="1"[^>]*>([\s\S]*?)<\/a>/g, (_, href: string, label: string) =>
      button(label.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&'), href.replace(/&amp;/g, '&')))
    .replace(/<h1>/g, `<h1 style="font-family:Georgia,serif;font-size:26px;color:${C.text};margin:0 0 14px">`)
    .replace(/<h2>/g, `<h2 style="font-family:Georgia,serif;font-size:21px;color:${C.text};margin:0 0 12px">`)
    .replace(/<h3>/g, `<h3 style="font-family:Georgia,serif;font-size:17px;color:${C.text};margin:18px 0 8px">`)
    .replace(/<p>/g, `<p style="margin:0 0 14px;line-height:1.6">`)
    .replace(/<a href=/g, `<a style="color:${C.brand}" href=`)
}

export interface LayoutOptions {
  body: string
  preheader?: string
  /** Enlace de baja: obligatorio en comunicaciones comerciales. */
  unsubscribeUrl?: string
  footerNote?: string
}

export function emailLayout({ body, preheader = '', unsubscribeUrl, footerNote }: LayoutOptions): string {
  const note = footerNote ?? 'Recibes este correo porque realizaste una consulta o un pedido en Dulce Momento.'
  const unsub = unsubscribeUrl
    ? `<br><a href="${escapeHtml(unsubscribeUrl)}" style="color:${C.soft}">Dejar de recibir novedades</a>`
    : ''
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dulce Momento</title></head>
<body style="margin:0;padding:0;background:${C.bg}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
<tr><td align="center" style="padding:0 0 18px">
<div style="font-family:Georgia,serif;font-size:26px;font-weight:bold;color:${C.text}">Dulce Momento</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:3px;color:${C.brand};margin-top:4px">KEKES ARTESANALES</div>
</td></tr>
<tr><td style="background:${C.card};border:1px solid ${C.line};border-radius:20px;padding:30px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:${C.soft}">
${body}
</td></tr>
<tr><td align="center" style="padding:18px 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${C.soft}">
Dulce Momento · Kekes artesanales por pedido · Lima<br>${escapeHtml(note)}${unsub}
</td></tr>
</table></td></tr></table></body></html>`
}

function summaryTable(rows: [string, string | null | undefined][]): string {
  const cells = rows
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) =>
      `<tr><td style="padding:7px 12px 7px 0;font-size:13px;color:${C.soft};vertical-align:top;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:7px 0;font-size:14px;color:${C.text};font-weight:bold">${escapeHtml(v).replace(/\n/g, '<br>')}</td></tr>`)
    .join('')
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${C.bg};border-radius:14px;padding:10px 16px;margin:6px 0 4px">${cells}</table>`
}

const h = (text: string) => `<h2>${escapeHtml(text)}</h2>`
const label = (text: string) =>
  `<p style="margin:20px 0 6px;font-size:11px;letter-spacing:2px;font-weight:bold;color:${C.brand}">${escapeHtml(text)}</p>`

export function whatsappUrl(number: string | null, message: string): string | null {
  const digits = (number ?? '').replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : null
}

export interface InquiryEmailData {
  request_code: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  inquiry_type: string
  product_name: string | null
  message: string | null
  marketing_consent: boolean
  contact_id?: string
  source?: string
}

export function inquiryConfirmationEmail(d: InquiryEmailData, siteUrl: string, whatsapp: string | null) {
  const wa = whatsappUrl(whatsapp, `Hola, les escribo por mi consulta ${d.request_code}.`)
  const body = styleContent(
    `<p>Hola, ${escapeHtml(d.first_name)}:</p>
<p>Gracias por comunicarte con Dulce Momento.</p>
<p>Hemos recibido correctamente tu consulta y nuestro equipo la revisará para responderte a la brevedad.</p>`) +
    label('RESUMEN DE TU SOLICITUD') +
    summaryTable([
      ['Código', d.request_code],
      ['Tipo', inquiryTypeLabel(d.inquiry_type)],
      ['Producto', d.product_name ?? 'No especificado'],
      ['Mensaje', d.message ?? 'Sin mensaje adicional'],
    ]) +
    button('Ver nuestros kekes', `${siteUrl}/productos`) +
    (wa ? `<p style="margin:0"><a href="${escapeHtml(wa)}" style="color:${C.brand};font-weight:bold">Hablar por WhatsApp</a></p>` : '')
  return {
    subject: 'Hemos recibido tu consulta — Dulce Momento',
    html: emailLayout({ body, preheader: `Tu código de consulta es ${d.request_code}.` }),
  }
}

export function inquiryInternalEmail(d: InquiryEmailData, siteUrl: string) {
  const fecha = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'long', timeStyle: 'short' })
  const body = styleContent(h(`Nueva consulta ${d.request_code}`)) +
    summaryTable([
      ['Nombre', d.first_name],
      ['Apellido', d.last_name || '—'],
      ['Correo', d.email],
      ['WhatsApp', d.phone ?? '—'],
      ['Tipo de consulta', inquiryTypeLabel(d.inquiry_type)],
      ['Producto', d.product_name ?? 'No especificado'],
      ['Mensaje', d.message ?? '—'],
      ['Origen', d.source ?? 'formulario'],
      ['Fecha', fecha],
      ['Consentimiento marketing', d.marketing_consent ? 'Sí' : 'No'],
    ]) +
    (d.contact_id ? button('Abrir en el CRM', `${siteUrl}/admin/contactos/${d.contact_id}`) : '')
  return {
    subject: `Nueva consulta ${d.request_code} — Dulce Momento`,
    html: emailLayout({ body, footerNote: 'Notificación interna del sitio web.' }),
  }
}

export interface OrderEmailData {
  order_code: string
  first_name: string
  email: string
  subtotal: number
  delivery_fee: number | null
  total: number
  payment_method: string
  payment_status: string
  delivery_type: string
  district: string | null
  items: { product_name: string; quantity: number; subtotal: number }[]
  contact_id?: string
}

function orderSummary(d: OrderEmailData) {
  return summaryTable([
    ['Código de pedido', d.order_code],
    ...d.items.map((i) => [`${i.quantity} × ${i.product_name}`, money(i.subtotal)] as [string, string]),
    ['Subtotal', money(d.subtotal)],
    ['Delivery', d.delivery_type === 'recojo' ? 'Recojo' : d.delivery_fee === null ? 'Por confirmar' : money(d.delivery_fee)],
    ['Total', d.delivery_fee === null && d.delivery_type !== 'recojo' ? `${money(d.total)} + delivery` : money(d.total)],
    ['Método de pago', PAYMENT_METHODS[d.payment_method] ?? d.payment_method],
    ['Estado del pago', PAYMENT_STATUS[d.payment_status] ?? d.payment_status],
  ])
}

export function orderConfirmationEmail(d: OrderEmailData, siteUrl: string) {
  const body = styleContent(
    `<p>Hola, ${escapeHtml(d.first_name)}:</p>
<p>Registramos tu pedido en Dulce Momento. Preparamos cada keke después de verificar el pago acordado; te contactaremos para coordinar la entrega.</p>`) +
    label('RESUMEN DE TU PEDIDO') + orderSummary(d) + button('Ver nuestros kekes', `${siteUrl}/productos`)
  return {
    subject: `Recibimos tu pedido ${d.order_code} — Dulce Momento`,
    html: emailLayout({ body, preheader: `Tu código de pedido es ${d.order_code}.` }),
  }
}

export function orderInternalEmail(d: OrderEmailData, siteUrl: string) {
  const body = styleContent(h(`Nuevo pedido ${d.order_code}`) + `<p>Cliente: ${escapeHtml(d.first_name)} · ${escapeHtml(d.email)}</p>`) +
    orderSummary(d) + button('Ver pedidos', `${siteUrl}/admin/pedidos`)
  return {
    subject: `Nuevo pedido ${d.order_code} — Dulce Momento`,
    html: emailLayout({ body, footerNote: 'Notificación interna del sitio web.' }),
  }
}
