import { CATALOG_PRICE, personalizationOptions } from './catalog.ts'

// faqData: fuente única para la FAQ pública, el contenido AEO, el JSON-LD FAQPage
// y las respuestas del Dulce Bot. Estructura AEO: pregunta → respuesta directa →
// detalle → CTA. Las respuestas usan solo información publicada en el sitio.

export type FaqTopic =
  | 'anticipacion'
  | 'precios'
  | 'personalizacion'
  | 'garantia'
  | 'pagos'
  | 'delivery'
  | 'porciones'
  | 'pedido'

export interface FaqItem {
  id: FaqTopic
  question: string
  /** Respuesta directa, en una o dos frases. */
  answer: string
  detail: string
  cta: { label: string; to: string }
  /** Palabras que el Dulce Bot usa para reconocer la pregunta. */
  keywords: string[]
}

const listaPersonalizacion = personalizationOptions.map((o) => o.toLowerCase()).join(', ')

export const faqData: FaqItem[] = [
  {
    id: 'anticipacion',
    question: '¿Con cuánta anticipación debo realizar mi pedido?',
    answer:
      'De 24 a 48 horas para los kekes clásicos y de 3 a 5 días para los pedidos personalizados.',
    detail:
      'Cada keke se prepara después de confirmar tu pedido. La anticipación exacta aparece en la ficha de cada producto.',
    cta: { label: 'Ver nuestros kekes', to: '/productos' },
    keywords: ['anticipacion', 'antes', 'tiempo', 'demora', 'cuando', 'urgente', 'hoy', 'mañana', 'dias', 'horas'],
  },
  {
    id: 'precios',
    question: '¿Cuánto cuesta un keke?',
    answer: `Los kekes del catálogo tienen un precio único de S/ ${CATALOG_PRICE}, todo incluido.`,
    detail:
      'El precio incluye preparación, decoración y empaque. El keke personalizado se cotiza según el diseño, y el delivery puede tener un costo adicional según la distancia.',
    cta: { label: 'Ver precios', to: '/productos' },
    keywords: ['precio', 'precios', 'cuesta', 'cuestan', 'cuanto', 'costo', 'vale', 'valor', 'soles'],
  },
  {
    id: 'personalizacion',
    question: '¿Realizan kekes personalizados?',
    answer: 'Sí. Personalizamos tu keke para que tenga el detalle exacto que imaginas.',
    detail: `Puedes elegir ${listaPersonalizacion}. Los pedidos personalizados se coordinan con 3 a 5 días de anticipación y su precio depende del diseño.`,
    cta: { label: 'Ver kekes personalizados', to: '/kekes-personalizados' },
    keywords: ['personalizar', 'personalizado', 'personalizados', 'dedicatoria', 'decoracion', 'diseño', 'color', 'colores'],
  },
  {
    id: 'garantia',
    question: '¿Qué incluye la garantía de entrega?',
    answer: 'Si tu pedido llega con más de 15 minutos de retraso o el keke llega dañado, lo reponemos sin costo.',
    detail: 'La entrega se realiza en la fecha y hora que acordamos contigo al confirmar el pedido.',
    cta: { label: 'Hacer una consulta', to: '/contacto' },
    keywords: ['garantia', 'retraso', 'dañado', 'reponen', 'reclamo', 'tarde', 'devolucion'],
  },
  {
    id: 'pagos',
    question: '¿Qué métodos de pago aceptan?',
    answer: 'Aceptamos Yape, Plin y transferencia bancaria.',
    detail:
      'Los datos de pago se muestran al finalizar tu pedido o se comparten por WhatsApp. Preparamos tu keke después de verificar el pago acordado.',
    cta: { label: 'Ir al carrito', to: '/carrito' },
    keywords: ['pago', 'pagos', 'pagar', 'yape', 'plin', 'transferencia', 'tarjeta', 'efectivo', 'metodo'],
  },
  {
    id: 'delivery',
    question: '¿Realizan delivery?',
    answer: 'Sí. Nuestra zona principal es San Isidro y también entregamos en Lima y distritos alrededores.',
    detail:
      'Escríbenos con tu distrito y confirmamos si llegamos a tu zona. El delivery puede tener un costo adicional según la distancia; te lo indicamos antes de confirmar tu pedido. La fecha y el horario se coordinan previamente.',
    cta: { label: 'Consultar mi dirección', to: '/contacto' },
    keywords: ['delivery', 'envio', 'envian', 'entrega', 'entregan', 'distrito', 'zona', 'cobertura', 'llevan', 'reparto'],
  },
  {
    id: 'porciones',
    question: '¿Puedo elegir el tamaño del keke?',
    answer: 'Nuestros kekes rinden de 8 a 20 porciones según el producto.',
    detail:
      'Los kekes clásicos rinden de 8 a 10 porciones, el de cumpleaños de 12 a 15 y la bandeja para reuniones trae 20 porciones individuales. En el keke personalizado eliges el tamaño.',
    cta: { label: 'Ver porciones por keke', to: '/productos' },
    keywords: ['porcion', 'porciones', 'tamaño', 'tamaños', 'personas', 'rinde', 'grande', 'pequeño', 'cuantas'],
  },
  {
    id: 'pedido',
    question: '¿Cómo confirmo mi pedido?',
    answer:
      'Elige tu keke, agrégalo al carrito y completa tus datos, o escríbenos por WhatsApp. Confirmamos sabor, tamaño, fecha y el pago acordado.',
    detail:
      'Al registrar tu pedido recibes un código. Preparamos el keke después de confirmar el pago y coordinamos la entrega por delivery en la fecha y hora acordadas.',
    cta: { label: 'Empezar mi pedido', to: '/productos' },
    keywords: ['pedido', 'pedir', 'comprar', 'ordenar', 'encargar', 'confirmo', 'confirmar', 'como hago', 'reservar'],
  },
]

export const getFaq = (id: FaqTopic) => faqData.find((f) => f.id === id)!

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

/** Busca la pregunta frecuente que mejor responde a un texto libre. */
export function matchFaq(text: string): FaqItem | null {
  const q = normalize(text)
  let best: FaqItem | null = null
  let bestScore = 0
  for (const item of faqData) {
    const score = item.keywords.filter((k) => q.includes(normalize(k))).length
    if (score > bestScore) {
      best = item
      bestScore = score
    }
  }
  return best
}
