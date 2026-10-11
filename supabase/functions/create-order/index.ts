// Checkout: crea el pedido con precios calculados en la base de datos.
// El pago nace PENDIENTE o EN VERIFICACIÓN; nunca PAGADO.
import { corsHeaders, json, rateLimit, readJson, serviceClient, SITE_URL } from '../_shared/http.ts'
import { getEmailConfig, sendTransactionalEmail } from '../_shared/email.ts'
import { orderConfirmationEmail, orderInternalEmail } from '../_shared/templates.ts'

const ERRORS: Record<string, string> = {
  carrito_vacio: 'Tu carrito está vacío.',
  carrito_demasiado_grande: 'El pedido tiene demasiados productos.',
  entrega_invalida: 'Selecciona un tipo de entrega válido.',
  pago_invalido: 'Selecciona un método de pago.',
  direccion_requerida: 'Indica el distrito y la dirección de entrega.',
  producto_no_disponible: 'Uno de los productos ya no está disponible. Revisa tu carrito.',
  cantidad_invalida: 'Revisa las cantidades de tu pedido.',
  email_invalido: 'Ingresa un correo electrónico válido.',
  nombre_invalido: 'Ingresa tu nombre.',
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {})

/** Solo se guardan opciones de personalización simples: texto corto o sí/no. */
function cleanOptions(v: unknown): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {}
  for (const [k, val] of Object.entries(obj(v)).slice(0, 10)) {
    const key = k.replace(/[^a-z_]/gi, '').slice(0, 30)
    if (!key) continue
    if (typeof val === 'boolean') { if (val) out[key] = true }
    else if (typeof val === 'string' && val.trim()) out[key] = val.trim().slice(0, 160)
  }
  return out
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)

  const body = await readJson(req)
  if (!body) return json({ error: 'Solicitud inválida.' }, 400)
  if (typeof body.website === 'string' && body.website.trim() !== '') return json({ error: 'No pudimos procesar tu pedido.' }, 400)

  const customer = obj(body.customer)
  const delivery = obj(body.delivery)
  const payment = obj(body.payment)
  const date = str(delivery.requested_date, 10)
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: 'La fecha solicitada no es válida.' }, 400)
  const phone = str(customer.phone, 30)
  if (!/^[0-9+\s()-]{6,20}$/.test(phone)) return json({ error: 'Ingresa un número de WhatsApp válido.' }, 400)

  const payload = {
    customer: {
      first_name: str(customer.first_name, 80),
      last_name: str(customer.last_name, 80),
      email: str(customer.email, 254).toLowerCase(),
      phone,
      marketing_consent: customer.marketing_consent === true,
    },
    delivery: {
      type: str(delivery.type, 20),
      district: str(delivery.district, 80),
      address: str(delivery.address, 200),
      reference: str(delivery.reference, 200),
      requested_date: date,
      comments: str(delivery.comments, 1000),
    },
    payment: { method: str(payment.method, 20), operation_number: str(payment.operation_number, 40) },
    items: (Array.isArray(body.items) ? body.items : []).slice(0, 20).map((raw) => {
      const item = obj(raw)
      return { product_id: str(item.product_id, 80), quantity: Number(item.quantity), options: cleanOptions(item.options) }
    }),
  }

  const db = serviceClient()
  if (!(await rateLimit(db, req, 'order', 5, 600))) {
    return json({ error: 'Recibimos varios pedidos seguidos. Inténtalo nuevamente en unos minutos.' }, 429)
  }

  const { data, error } = await db.rpc('create_order', { p: payload })
  if (error || !data) {
    const key = Object.keys(ERRORS).find((k) => error?.message?.includes(k))
    if (!key) console.error('create_order', error?.message)
    return json({ error: key ? ERRORS[key] : 'No pudimos registrar tu pedido. Inténtalo nuevamente.' }, key ? 400 : 500)
  }

  const config = await getEmailConfig(db)
  const sent = await sendTransactionalEmail(
    db, config, { to: data.email, ...orderConfirmationEmail(data, SITE_URL), replyTo: config.adminEmail }, data.contact_id)
  if (!sent.ok) console.error('order_email', sent.error)
  if (config.adminEmail) {
    await sendTransactionalEmail(db, config, { to: config.adminEmail, ...orderInternalEmail(data, SITE_URL), replyTo: data.email })
  }

  const { order_id: _o, contact_id: _c, ...result } = data
  return json({ ...result, email_sent: sent.ok })
})
