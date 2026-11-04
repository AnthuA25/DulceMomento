import { corsHeaders, json, rateLimit, readJson, serviceClient } from '../_shared/http.ts'

const BUCKET = 'payment-receipts'
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf'])

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)

  const body = await readJson(req)
  if (!body) return json({ error: 'Solicitud inválida.' }, 400)
  const orderCode = str(body.order_code, 20).toUpperCase()
  const email = str(body.email, 254).toLowerCase()
  if (!/^DMP-\d{6}$/.test(orderCode) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'No pudimos verificar el pedido.' }, 404)
  }

  const db = serviceClient()
  if (!(await rateLimit(db, req, 'payment-proof', 12, 900))) {
    return json({ error: 'Demasiados intentos. Espera unos minutos e inténtalo nuevamente.' }, 429)
  }

  const { data: order, error: orderError } = await db
    .from('orders').select('id, contact_id, payments(id, method, status, receipt_path)')
    .eq('order_code', orderCode).maybeSingle()
  if (orderError) {
    console.error('payment_proof_order', orderError.message)
    return json({ error: 'No pudimos verificar el pedido.' }, 500)
  }
  if (!order) return json({ error: 'No pudimos verificar el pedido.' }, 404)

  const { data: contact, error: contactError } = await db
    .from('contacts').select('email').eq('id', order.contact_id).single()
  if (contactError) {
    console.error('payment_proof_contact', contactError.message)
    return json({ error: 'No pudimos verificar el pedido.' }, 500)
  }
  if (contact.email.toLowerCase() !== email) return json({ error: 'No pudimos verificar el pedido.' }, 404)

  const payment = order.payments?.[0]
  if (!payment || !['yape', 'plin', 'transferencia'].includes(payment.method)) {
    return json({ error: 'Este pedido no admite comprobantes de pago manual.' }, 409)
  }
  if (payment.status === 'pagado') return json({ error: 'Este pago ya fue verificado.' }, 409)
  if (payment.status === 'en_verificacion' && payment.receipt_path) {
    return json({ error: 'Ya recibimos un comprobante para este pago.' }, 409)
  }

  if (body.action === 'create') {
    const path = `${order.id}/${crypto.randomUUID()}`
    const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: false })
    if (error || !data) {
      console.error('payment_proof_upload_url', error?.message)
      return json({ error: 'No se pudo preparar la carga del comprobante.' }, 500)
    }
    return json({ path, token: data.token })
  }

  if (body.action === 'attach') {
    const path = str(body.path, 120)
    if (!new RegExp(`^${order.id}/[0-9a-f-]{36}$`, 'i').test(path)) {
      return json({ error: 'El archivo no corresponde a este pedido.' }, 400)
    }

    const { data: file, error: fileError } = await db.storage.from(BUCKET).info(path)
    if (fileError || !file) return json({ error: 'No encontramos el archivo cargado.' }, 400)
    const metadata = file.metadata as Record<string, unknown> | null
    const contentType = typeof metadata?.mimetype === 'string' ? metadata.mimetype : ''
    const fileSize = Number(metadata?.size ?? 0)
    if (!ALLOWED_TYPES.has(contentType) || fileSize <= 0 || fileSize > MAX_FILE_SIZE) {
      const { error: removeError } = await db.storage.from(BUCKET).remove([path])
      if (removeError) console.error('payment_proof_invalid_file_cleanup', removeError.message)
      return json({ error: 'El comprobante debe ser PDF, JPG o PNG y no superar 5 MB.' }, 400)
    }

    const { data: updated, error: updateError } = await db.from('payments')
      .update({ receipt_path: path, status: 'en_verificacion' })
      .eq('id', payment.id).in('status', ['pendiente', 'en_verificacion', 'rechazado'])
      .select('id').maybeSingle()
    if (updateError || !updated) {
      if (updateError) console.error('payment_proof_attach', updateError.message)
      const { error: removeError } = await db.storage.from(BUCKET).remove([path])
      if (removeError) console.error('payment_proof_attach_cleanup', removeError.message)
      return json({ error: 'No se pudo asociar el comprobante al pedido.' }, 409)
    }
    if (payment.receipt_path) {
      const { error: oldFileError } = await db.storage.from(BUCKET).remove([payment.receipt_path])
      if (oldFileError) console.error('payment_proof_old_file_cleanup', oldFileError.message)
    }
    return json({ ok: true })
  }

  return json({ error: 'Acción no reconocida.' }, 400)
})
