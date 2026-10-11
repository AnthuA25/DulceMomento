// Operaciones públicas. Todas pasan por Edge Functions: el navegador nunca
// escribe directamente en las tablas de clientes.
import { track } from '@/lib/analytics'
import { callFunction } from '@/lib/supabase'
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
  /** Honeypot anti-spam: debe llegar vacío. */
  website?: string
}

export async function submitInquiry(input: InquiryInput): Promise<InquiryResult> {
  track('form_submit', { source: input.source, inquiry_type: input.inquiry_type })
  const result = await callFunction<InquiryResult>('submit-inquiry', { ...input })
  track('lead_created', { source: input.source })
  return result
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
  // Se envían solo ids, cantidades y opciones: el precio lo calcula el servidor.
  const result = await callFunction<OrderResult>('create-order', {
    ...input,
    items: input.items.map((i) => ({ product_id: i.productId, quantity: i.quantity, options: i.options })),
  })
  track('purchase_created', { order_code: result.order_code, value: result.total })
  return result
}

export const unsubscribe = (token: string) => callFunction<{ ok: true }>('unsubscribe', { token })
