import { track } from './analytics.ts'

/**
 * Enlace de WhatsApp con mensaje preparado. Siempre abre la conversación para
 * que la persona decida enviarlo; nunca envía nada automáticamente.
 * Sin número configurado, WhatsApp pide elegir el contacto.
 */
export function whatsappLink(number: string | null | undefined, message: string): string {
  const digits = (number ?? '').replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export const waMessages = {
  general: 'Hola, Dulce Momento 👋 Quisiera hacer un pedido.',
  product: (name: string) => `Hola, Dulce Momento 👋 Quiero el ${name}. ¿Me ayudan con mi pedido?`,
  personalize: 'Hola, Dulce Momento 👋 Quiero personalizar un keke. Les cuento la ocasión:',
  occasion: (name: string) => `Hola, Dulce Momento 👋 Busco un keke para: ${name}. ¿Qué me recomiendan?`,
  delivery: 'Hola, Dulce Momento 👋 Quisiera saber si hacen delivery a mi dirección. Mi distrito es:',
  order: (code: string) => `Hola, Dulce Momento 👋 Registré el pedido ${code} y quiero coordinar el pago y la entrega.`,
  crm: (name: string, product: string | null) =>
    `Hola ${name} 👋 Te escribimos de Dulce Momento por la consulta que realizaste sobre ${product ?? 'nuestros kekes'}. ¿En qué podemos ayudarte?`,
}

export const trackWhatsApp = (origin: string) => track('whatsapp_click', { origin })
