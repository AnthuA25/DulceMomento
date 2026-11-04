import { addDoc, collection, doc, writeBatch } from 'firebase/firestore'
import { auth, requireFirestore } from '@/lib/firebase'
import { track } from '@/lib/analytics'
import type { CartItem, InquiryResult, InquirySource, InquiryType, OrderResult, PaymentMethod } from '@/types'

export interface InquiryInput {
  first_name: string
  last_name: string
  email: string
  phone: string
  inquiry_type: InquiryType
  product_id?: string
  event_type?: string
  event_date?: string
  quantity?: string
  message?: string
  marketing_consent: boolean
  source: InquirySource
  website?: string
}

const text = (value: unknown) => typeof value === 'string' ? value.trim() : ''
const emailAddress = (value: string) => value.trim().toLowerCase()
const timestamp = () => new Date().toISOString()
const code = (prefix: string) => `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`

async function createContact(input: {
  first_name: string
  last_name: string
  email: string
  phone: string
  marketing_consent: boolean
  source: string
}) {
  const created_at = timestamp()
  const reference = await addDoc(collection(requireFirestore(), 'contacts'), {
    ...input,
    email: emailAddress(input.email),
    customer_type: 'nuevo',
    lifecycle_stage: 'lead',
    crm_stage: 'nuevo',
    marketing_consent_at: input.marketing_consent ? created_at : null,
    created_at,
    updated_at: created_at,
  })
  return reference.id
}

export async function submitInquiry(input: InquiryInput): Promise<InquiryResult> {
  if (text(input.website)) throw new Error('No se pudo enviar el formulario.')
  if (text(input.first_name).length < 2 || text(input.last_name).length < 2
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress(input.email))
    || !text(input.phone) || text(input.message).length > 4000) {
    throw new Error('Revisa los datos del formulario e inténtalo nuevamente.')
  }
  track('contact_form_submit', { source: input.source, inquiry_type: input.inquiry_type })
  const db = requireFirestore()
  const contactId = await createContact({
    first_name: text(input.first_name),
    last_name: text(input.last_name),
    email: input.email,
    phone: text(input.phone),
    marketing_consent: Boolean(input.marketing_consent),
    source: input.source,
  })
  const created_at = timestamp()
  const request_code = code('DM')
  const inquiry = {
    contact_id: contactId,
    request_code,
    inquiry_type: input.inquiry_type,
    product_name: text(input.product_id) || null,
    event_type: text(input.event_type) || null,
    event_date: text(input.event_date) || null,
    quantity: text(input.quantity) || null,
    message: text(input.message) || null,
    source: input.source,
    status: 'nueva',
    created_at,
  }
  await addDoc(collection(db, 'inquiries'), inquiry)
  track('lead_created', { source: input.source })
  return {
    request_code,
    first_name: text(input.first_name),
    last_name: text(input.last_name),
    email: emailAddress(input.email),
    phone: text(input.phone),
    inquiry_type: input.inquiry_type,
    product_name: inquiry.product_name,
    message: inquiry.message,
    email_sent: false,
  }
}

export interface OrderInput {
  customer: { first_name: string; last_name: string; email: string; phone: string; marketing_consent: boolean }
  delivery: {
    type: 'delivery' | 'recojo'
    district: string
    address: string
    reference: string
    requested_date: string
    comments: string
  }
  payment: { method: PaymentMethod; operation_number: string }
  items: CartItem[]
  website?: string
}

export async function createOrder(input: OrderInput): Promise<OrderResult> {
  const user = auth?.currentUser
  const db = requireFirestore()
  if (!user || emailAddress(user.email ?? '') !== emailAddress(input.customer.email)) {
    throw new Error('Inicia sesión con tu cuenta de cliente para realizar tu compra.')
  }
  if (text(input.website) || input.items.length < 1 || input.items.length > 20) {
    throw new Error('No se pudo registrar el pedido. Revisa el carrito e inténtalo nuevamente.')
  }

  const items = input.items.map((item) => ({
    id: item.lineId,
    product_id: item.productId,
    product_name: item.name,
    unit_price: item.unitPrice,
    quantity: item.quantity,
    options: item.options,
    subtotal: item.unitPrice * item.quantity,
  }))
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const delivery_fee = input.delivery.type === 'recojo' ? 0 : null
  const total = subtotal + (delivery_fee ?? 0)
  const order_code = code('DMP')
  const created_at = timestamp()
  const contactId = await createContact({
    first_name: text(input.customer.first_name),
    last_name: text(input.customer.last_name),
    email: input.customer.email,
    phone: text(input.customer.phone),
    marketing_consent: Boolean(input.customer.marketing_consent),
    source: 'checkout',
  })
  const orderRef = doc(collection(db, 'orders'))
  const batch = writeBatch(db)
  const payment = {
    id: doc(collection(db, 'payments')).id,
    order_id: orderRef.id,
    method: input.payment.method,
    amount: total,
    operation_number: text(input.payment.operation_number) || null,
    status: 'pendiente',
    verified_at: null,
    created_at,
  }
  batch.set(orderRef, {
    order_code,
    customer_uid: user.uid,
    contact_id: contactId,
    contact: {
      first_name: text(input.customer.first_name),
      last_name: text(input.customer.last_name),
      email: emailAddress(input.customer.email),
      phone: text(input.customer.phone),
    },
    delivery_type: input.delivery.type,
    district: text(input.delivery.district) || null,
    address: text(input.delivery.address) || null,
    reference: text(input.delivery.reference) || null,
    requested_date: text(input.delivery.requested_date) || null,
    comments: text(input.delivery.comments) || null,
    subtotal,
    delivery_fee,
    total,
    status: 'recibido',
    payment_status: 'pendiente',
    requires_price_verification: true,
    items: items.map(({ product_id, quantity }) => ({ product_id, quantity })),
    order_items: items,
    payments: [payment],
    created_at,
  })
  await batch.commit()

  const result: OrderResult = {
    order_code,
    subtotal,
    delivery_fee,
    total,
    payment_method: input.payment.method,
    payment_status: 'pendiente',
    delivery_type: input.delivery.type,
    district: text(input.delivery.district) || null,
    items: items.map(({ product_name, unit_price, quantity, options, subtotal: itemSubtotal }) => ({
      product_name, unit_price, quantity, options, subtotal: itemSubtotal,
    })),
    first_name: text(input.customer.first_name),
    email: emailAddress(input.customer.email),
    email_sent: false,
  }
  track('purchase', {
    transaction_id: result.order_code,
    currency: 'PEN',
    value: result.total,
    items: result.items.map((item) => ({ item_name: item.product_name, price: item.unit_price, quantity: item.quantity })),
  })
  return result
}

export async function submitPaymentProof(_orderCode: string, _email: string, _file: File) {
  throw new Error('La carga de comprobantes requiere validación segura del servidor y no está disponible en el plan Spark.')
}

export async function unsubscribe(_token: string) {
  throw new Error('La baja de comunicaciones requiere configurar un servidor seguro.')
}
