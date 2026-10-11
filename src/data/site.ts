import type { InquiryType, LifecycleStage, OrderStatus, PaymentStatus, PublicSettings } from '../types/index.ts'
import { publicAsset } from '@/utils/assets'

export const SITE_URL = (import.meta.env?.VITE_SITE_URL || 'http://localhost:5173').replace(/\/$/, '')

export const PENDING = 'Por configurar'

// Valores por defecto mientras no se cargue (o no exista) la configuración en la base.
export const defaultSettings: PublicSettings = {
  business_name: 'Dulce Momento',
  whatsapp_number: null,
  instagram_url: null,
  facebook_url: null,
  tiktok_url: null,
  payment_yape: { number: null, holder: null },
  payment_plin: { number: null, holder: null },
  payment_transfer: { bank: null, holder: null, account: null, cci: null },
  delivery_zones: [{ name: 'San Isidro', fee: null }],
  pickup_enabled: false,
  seo_title: 'Dulce Momento | Kekes artesanales en Lima',
  seo_description:
    'Kekes artesanales hechos por pedido en Lima. Precio único de S/ 50 todo incluido y delivery en San Isidro y alrededores.',
}

export const navLinks = [
  { label: 'Nuestros kekes', to: '/productos' },
  { label: 'Personalización', to: '/kekes-personalizados' },
  { label: 'Ocasiones', to: '/#ocasiones' },
  { label: 'Cómo funciona', to: '/#como-funciona' },
  { label: 'Galería', to: '/#galeria' },
  { label: 'Delivery', to: '/#delivery' },
  { label: 'Preguntas', to: '/#preguntas' },
  { label: 'Contacto', to: '/contacto' },
]

export const heroFacts = [
  { icon: 'tag', text: 'S/ 50 todo incluido' },
  { icon: 'cake', text: '8 a 20 porciones según el keke' },
  { icon: 'clock', text: '24 a 48 h de anticipación' },
  { icon: 'pin', text: 'Delivery en San Isidro y Lima' },
] as const

export const benefits = [
  { icon: 'wheat', title: 'Ingredientes seleccionados', text: 'Recetas de casa y horneado en pequeñas cantidades.' },
  { icon: 'cake', title: 'Hecho por pedido', text: 'Cada keke se prepara después de confirmar tu pedido.' },
  { icon: 'tag', title: 'Precio único de S/ 50', text: 'Todo incluido: preparación, decoración y empaque.' },
  { icon: 'truck', title: 'Delivery coordinado', text: 'Entrega en la fecha y hora que acordamos contigo.' },
  { icon: 'shield', title: 'Garantía de entrega', text: 'Retraso de más de 15 minutos o keke dañado: lo reponemos sin costo.' },
  { icon: 'gift', title: 'Presentación cuidada', text: 'Empaque listo para regalar y para la foto.' },
] as const

export const occasions = [
  { emoji: '🎂', title: 'Cumpleaños', text: 'Para soplar las velitas en casa o en la oficina.' },
  { emoji: '💖', title: 'Aniversarios', text: 'Un detalle con dedicatoria para una fecha importante.' },
  { emoji: '💼', title: 'Oficina', text: 'Porciones individuales para compartir en reuniones.' },
  { emoji: '✨', title: 'Momentos especiales', text: 'Cualquier motivo que merezca algo dulce.' },
]

export const steps = [
  { title: 'Escríbenos', text: 'Elige tu keke del catálogo o cuéntanos qué necesitas por WhatsApp.' },
  { title: 'Lo preparamos', text: 'Preparamos tu pedido después de confirmar sabor, tamaño, fecha y el pago acordado.' },
  { title: 'Lo recibes', text: 'Coordinamos la entrega por delivery en la fecha y hora acordadas.' },
]

// DATOS DEMOSTRATIVOS: deben reemplazarse por opiniones reales de clientes.
export const demoTestimonials = [
  {
    name: 'María del Pilar',
    text: 'Pedí un keke para el cumpleaños de mi mamá y llegó exactamente a la hora coordinada. La presentación estuvo hermosa y estaba delicioso.',
  },
  {
    name: 'Andrea R.',
    text: 'El keke de chocolate fue el favorito de la reunión. Muy húmedo y con una cobertura increíble. Ya pedí otro para la próxima semana.',
  },
  {
    name: 'Lucía Fernández',
    text: 'Me ayudaron con la dedicatoria y los colores para un aniversario. La atención por WhatsApp fue rapidísima y muy amable.',
  },
]

export const gallery = [
  { src: publicAsset('/img/galeria-empaque.jpg'), alt: 'Keke en caja de regalo con lazo', w: 359, h: 333 },
  { src: publicAsset('/img/galeria-marmoleado.jpg'), alt: 'Porción de keke marmoleado servida en un plato', w: 358, h: 333 },
  { src: publicAsset('/img/galeria-cumpleanos.jpg'), alt: 'Keke de cumpleaños con crema rosada y velas encendidas', w: 359, h: 480 },
  { src: publicAsset('/img/galeria-decorado.jpg'), alt: 'Decorado a mano de un keke con manga pastelera', w: 359, h: 480 },
  { src: publicAsset('/img/galeria-flores.jpg'), alt: 'Keke decorado con flores y frutas sobre una base de vidrio', w: 358, h: 359 },
  { src: publicAsset('/img/galeria-rosas.jpg'), alt: 'Keke personalizado con rosas y detalles dorados', w: 359, h: 359 },
]

export const deliveryInfo = [
  {
    title: 'Distritos',
    text: 'Entregamos en San Isidro y en Lima y alrededores. Escríbenos con tu distrito y te confirmamos si llegamos a tu zona.',
  },
  { title: 'Horarios', text: 'La fecha y el horario de entrega se coordinan previamente por WhatsApp.' },
  {
    title: 'Costo',
    text: 'El delivery puede tener un costo adicional según la distancia. Te lo indicamos antes de confirmar tu pedido.',
  },
  {
    title: 'Anticipación recomendada',
    text: 'De 24 a 48 horas para kekes clásicos y de 3 a 5 días para pedidos personalizados.',
  },
]

export const eventTypes = ['Cumpleaños', 'Aniversario', 'Oficina', 'Momento especial']

export const inquiryTypeLabels: Record<InquiryType, string> = {
  cotizacion: 'Cotización',
  keke_personalizado: 'Keke personalizado',
  pedido: 'Pedido',
  delivery: 'Delivery',
  otro: 'Otra consulta',
}

export const inquiryStatusLabels = {
  nueva: 'Nueva',
  en_proceso: 'En proceso',
  respondida: 'Respondida',
  cerrada: 'Cerrada',
} as const

export const lifecycleLabels: Record<LifecycleStage, string> = {
  lead: 'Lead',
  interesado: 'Interesado',
  cliente: 'Cliente',
  cliente_recurrente: 'Cliente recurrente',
  cliente_fidelizado: 'Cliente fidelizado',
}
export const lifecycleOrder = Object.keys(lifecycleLabels) as LifecycleStage[]

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pendiente: 'Pendiente',
  en_verificacion: 'En verificación',
  pagado: 'Pagado',
  rechazado: 'Rechazado',
}

export const paymentMethodLabels = {
  yape: 'Yape',
  plin: 'Plin',
  transferencia: 'Transferencia bancaria',
  online: 'Pago online',
} as const

export const orderStatusLabels: Record<OrderStatus, string> = {
  recibido: 'Recibido',
  confirmado: 'Confirmado',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  en_camino: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}
