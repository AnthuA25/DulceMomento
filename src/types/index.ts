export type CategoryId = 'clasicos' | 'personalizados' | 'cumpleanos' | 'reuniones' | 'fechas-especiales'

export interface PersonalizationField {
  id: string
  label: string
  type: 'text' | 'checkbox'
  placeholder?: string
  maxLength?: number
}

export interface Product {
  id: string
  slug: string
  name: string
  category: CategoryId
  /** Etiqueta superior de la card, tal como aparece en el diseño. */
  categoryLabel: string
  description: string
  /** null = precio según diseño: solo se cotiza, no entra al carrito. */
  price: number | null
  portions: string
  leadTime: string
  flavorsLabel: string
  /** Opciones de sabor seleccionables. Vacío = sin selección. */
  flavors: string[]
  customizable: boolean
  personalizationFields: PersonalizationField[]
  image: string
  imageAlt: string
  active: boolean
}

export type ItemOptions = Record<string, string | boolean>

export interface CartItem {
  lineId: string
  productId: string
  slug: string
  name: string
  image: string
  unitPrice: number
  quantity: number
  options: ItemOptions
}

export type CustomerType = 'nuevo' | 'recurrente'
export type LifecycleStage = 'lead' | 'interesado' | 'cliente' | 'cliente_recurrente' | 'cliente_fidelizado'
export type InquiryType = 'cotizacion' | 'keke_personalizado' | 'pedido' | 'delivery' | 'otro'
export type InquiryStatus = 'nueva' | 'en_proceso' | 'respondida' | 'cerrada'
export type InquirySource = 'formulario' | 'chatbot' | 'checkout' | 'suscripcion'
export type PaymentMethod = 'yape' | 'plin' | 'transferencia'
export type PaymentStatus = 'pendiente' | 'en_verificacion' | 'pagado' | 'rechazado'
export type OrderStatus = 'recibido' | 'confirmado' | 'en_preparacion' | 'listo' | 'en_camino' | 'entregado' | 'cancelado'
export type CampaignKind = 'comercial' | 'operativa'
export type CampaignStatus = 'borrador' | 'programada' | 'enviando' | 'enviada' | 'error'

export interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  customer_type: CustomerType
  lifecycle_stage: LifecycleStage
  marketing_consent: boolean
  marketing_consent_at: string | null
  source: string
  created_at: string
  updated_at: string
}

export interface ContactRow extends Contact {
  inquiries_count: number
  orders_count: number
  last_inquiry_type: InquiryType | null
  last_product_name: string | null
  last_activity_at: string
}

export interface Inquiry {
  id: string
  contact_id: string
  request_code: string
  inquiry_type: InquiryType
  product_name: string | null
  event_type: string | null
  event_date: string | null
  quantity: string | null
  message: string | null
  source: InquirySource
  status: InquiryStatus
  created_at: string
}

export interface CrmNote {
  id: string
  contact_id: string
  body: string
  created_at: string
}

export interface OrderItem {
  id: string
  product_name: string
  unit_price: number
  quantity: number
  options: ItemOptions
  subtotal: number
}

export interface Payment {
  id: string
  order_id: string
  method: PaymentMethod | 'online'
  amount: number
  operation_number: string | null
  status: PaymentStatus
  verified_at: string | null
  created_at: string
}

export interface Order {
  id: string
  order_code: string
  contact_id: string
  delivery_type: 'delivery' | 'recojo'
  district: string | null
  address: string | null
  reference: string | null
  requested_date: string | null
  comments: string | null
  subtotal: number
  delivery_fee: number | null
  total: number
  status: OrderStatus
  created_at: string
  contact?: Pick<Contact, 'first_name' | 'last_name' | 'email' | 'phone'>
  order_items?: OrderItem[]
  payments?: Payment[]
}

export interface Campaign {
  id: string
  name: string
  subject: string
  sender_name: string
  kind: CampaignKind
  html: string
  segment: string
  status: CampaignStatus
  scheduled_at: string | null
  sent_at: string | null
  recipients_count: number
  error: string | null
  created_at: string
}

export interface Automation {
  id: string
  key: string
  name: string
  description: string
  trigger_label: string
  requires_marketing_consent: boolean
  enabled: boolean
  automation_steps: { id: string; step_order: number; delay_days: number; name: string; subject: string }[]
}

export interface DeliveryZone {
  name: string
  fee: number | null
}

export interface WalletInfo {
  number: string | null
  holder: string | null
}

export interface TransferInfo {
  bank: string | null
  holder: string | null
  account: string | null
  cci: string | null
}

export interface PublicSettings {
  business_name: string
  whatsapp_number: string | null
  instagram_url: string | null
  facebook_url: string | null
  tiktok_url: string | null
  payment_yape: WalletInfo
  payment_plin: WalletInfo
  payment_transfer: TransferInfo
  delivery_zones: DeliveryZone[]
  pickup_enabled: boolean
  seo_title: string
  seo_description: string
}

export interface PrivateSettings {
  admin_email: string | null
  sender_name: string
  sender_email: string | null
  loyalty_min_orders: number
}

export interface InquiryResult {
  request_code: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  inquiry_type: InquiryType
  product_name: string | null
  message: string | null
  email_sent: boolean
}

export interface OrderResult {
  order_code: string
  subtotal: number
  delivery_fee: number | null
  total: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  delivery_type: 'delivery' | 'recojo'
  district: string | null
  items: { product_name: string; unit_price: number; quantity: number; options: ItemOptions; subtotal: number }[]
  first_name: string
  email: string
  email_sent: boolean
}
