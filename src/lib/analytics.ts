export type AnalyticsEvent =
  | 'page_view'
  | 'view_item'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'view_cart'
  | 'begin_checkout'
  | 'purchase'
  | 'contact_form_submit'
  | 'lead_created'
  | 'whatsapp_click'
  | 'chatbot_open'
  | 'chatbot_order'

type AnalyticsItem = {
  item_id?: string
  item_name?: string
  item_category?: string
  price?: number
  quantity?: number
}

type Gtag = (...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
  }
}

const measurementId = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim() ?? ''
const validMeasurementId = /^G-[A-Z0-9]+$/.test(measurementId) ? measurementId : null
let initializedId: string | null = null

function initializeAnalytics() {
  if (!validMeasurementId || typeof window === 'undefined' || typeof document === 'undefined') return
  if (initializedId === validMeasurementId && window.gtag) return

  window.dataLayer = window.dataLayer ?? []
  window.gtag = window.gtag ?? ((...args: unknown[]) => window.dataLayer?.push(args))
  window.gtag('js', new Date())
  window.gtag('config', validMeasurementId, { send_page_view: false })

  if (!document.querySelector(`script[data-ga4="${validMeasurementId}"]`)) {
    const script = document.createElement('script')
    script.async = true
    script.dataset.ga4 = validMeasurementId
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(validMeasurementId)}`
    document.head.appendChild(script)
  }
  initializedId = validMeasurementId
}

function items(value: unknown): AnalyticsItem[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, 20).flatMap((raw) => {
    if (!raw || typeof raw !== 'object') return []
    const item = raw as Record<string, unknown>
    const safe: AnalyticsItem = {}
    if (typeof item.item_id === 'string' && /^[a-z0-9_-]{1,80}$/i.test(item.item_id)) safe.item_id = item.item_id
    if (typeof item.item_name === 'string' && item.item_name.length <= 120) safe.item_name = item.item_name
    if (typeof item.item_category === 'string' && /^[a-z0-9_-]{1,80}$/i.test(item.item_category)) safe.item_category = item.item_category
    if (typeof item.price === 'number' && Number.isFinite(item.price) && item.price >= 0) safe.price = item.price
    if (typeof item.quantity === 'number' && Number.isInteger(item.quantity) && item.quantity > 0) safe.quantity = item.quantity
    return Object.keys(safe).length ? [safe] : []
  })
}

export function sanitizeAnalyticsParams(event: AnalyticsEvent, input: Record<string, unknown>) {
  const params: Record<string, unknown> = {}
  const enumValue = (key: string, values: readonly string[]) => {
    const value = input[key]
    if (typeof value === 'string' && values.includes(value)) params[key] = value
  }
  const money = () => {
    if (typeof input.currency === 'string' && input.currency === 'PEN') params.currency = input.currency
    if (typeof input.value === 'number' && Number.isFinite(input.value) && input.value >= 0) params.value = input.value
    const safeItems = items(input.items)
    if (safeItems.length) params.items = safeItems
  }

  switch (event) {
    case 'page_view':
      if (typeof input.page_path === 'string' && input.page_path.startsWith('/') && !input.page_path.startsWith('//')) {
        params.page_path = input.page_path.split(/[?#]/, 1)[0].slice(0, 200)
      }
      break
    case 'view_item':
      money()
      break
    case 'add_to_cart':
    case 'remove_from_cart':
    case 'view_cart':
    case 'begin_checkout':
    case 'purchase':
      money()
      if (event === 'purchase' && typeof input.transaction_id === 'string' && /^[a-z0-9_-]{1,80}$/i.test(input.transaction_id)) {
        params.transaction_id = input.transaction_id
      }
      break
    case 'contact_form_submit':
      enumValue('source', ['formulario', 'chatbot', 'checkout', 'suscripcion'])
      enumValue('inquiry_type', ['cotizacion', 'keke_personalizado', 'pedido', 'delivery', 'otro'])
      break
    case 'lead_created':
      enumValue('source', ['formulario', 'chatbot', 'checkout', 'suscripcion'])
      break
    case 'whatsapp_click':
      break
    case 'chatbot_open':
    case 'chatbot_order':
      break
  }
  return params
}

export function track(event: AnalyticsEvent, input: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  initializeAnalytics()
  const params = sanitizeAnalyticsParams(event, input)
  const payload = { event, ...params }
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push(payload)
  if (validMeasurementId) window.gtag?.('event', event, params)
  if (import.meta.env.DEV) console.debug('[analytics]', event, params)
}
