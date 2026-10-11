// Capa de analítica. No hay Google Analytics conectado: los eventos se publican en
// window.dataLayer (formato compatible con GTM/GA4) para que queden listos cuando
// se instale una herramienta de medición. En desarrollo se muestran en la consola.

export type AnalyticsEvent =
  | 'view_product'
  | 'add_to_cart'
  | 'begin_checkout'
  | 'purchase_created'
  | 'form_submit'
  | 'lead_created'
  | 'chatbot_open'
  | 'whatsapp_click'
  | 'email_campaign_sent'

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

export function track(event: AnalyticsEvent, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push({ event, ...params })
  if (import.meta.env.DEV) console.debug('[analytics]', event, params)
}
