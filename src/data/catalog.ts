import type { CategoryId, PersonalizationField, Product } from '../types/index.ts'
import { publicAsset } from '@/utils/assets'

// Fuente única del catálogo. La landing, el detalle, el carrito, el Dulce Bot,
// el SEO y `supabase/seed.sql` (npm run generate) leen de aquí.
// Contenido tomado del diseño aprobado; no agregar productos ni precios sin confirmar.

export const CATALOG_PRICE = 50

export const categories: { id: CategoryId; label: string }[] = [
  { id: 'clasicos', label: 'Kekes clásicos' },
  { id: 'personalizados', label: 'Kekes personalizados' },
  { id: 'cumpleanos', label: 'Para cumpleaños' },
  { id: 'reuniones', label: 'Para reuniones' },
  { id: 'fechas-especiales', label: 'Para fechas especiales' },
]

// Opciones de personalización que ofrece Dulce Momento (sección "Hazlo único").
export const personalizationOptions = [
  'Dedicatorias',
  'Colores',
  'Decoraciones',
  'Tamaños',
  'Presentaciones especiales',
  'Empaques para regalo',
]

const dedicatoria: PersonalizationField = {
  id: 'dedicatoria',
  label: 'Dedicatoria',
  type: 'text',
  placeholder: 'Ej. Feliz cumpleaños, mamá',
  maxLength: 60,
}
const colores: PersonalizationField = {
  id: 'colores',
  label: 'Colores',
  type: 'text',
  placeholder: 'Ej. tonos pastel, rosa y crema',
  maxLength: 80,
}
const decoracion: PersonalizationField = {
  id: 'decoracion',
  label: 'Decoración',
  type: 'text',
  placeholder: 'Cuéntanos qué decoración imaginas',
  maxLength: 120,
}
const empaque: PersonalizationField = { id: 'empaque_regalo', label: 'Empaque para regalo', type: 'checkbox' }

export const products: Product[] = [
  {
    id: 'keke-de-chocolate',
    slug: 'keke-de-chocolate',
    name: 'Keke de chocolate',
    category: 'clasicos',
    categoryLabel: 'Kekes clásicos',
    description: 'Keke artesanal de chocolate con cobertura y decoración especial.',
    price: CATALOG_PRICE,
    portions: '8 a 10 porciones',
    leadTime: 'Pedido con 48 horas de anticipación',
    flavorsLabel: 'Chocolate, chocolate con manjar',
    flavors: ['Chocolate', 'Chocolate con manjar'],
    customizable: true,
    personalizationFields: [dedicatoria, empaque],
    image: publicAsset('/img/keke-de-chocolate.jpg'),
    imageAlt: 'Keke artesanal de chocolate con cobertura brillante y virutas de chocolate',
    active: true,
  },
  {
    id: 'keke-de-vainilla',
    slug: 'keke-de-vainilla',
    name: 'Keke de vainilla',
    category: 'clasicos',
    categoryLabel: 'Kekes clásicos',
    description: 'Keke suave de vainilla con glaseado ligero, ideal para acompañar el café.',
    price: CATALOG_PRICE,
    portions: '8 a 10 porciones',
    leadTime: 'Pedido con 24 horas de anticipación',
    flavorsLabel: 'Vainilla, vainilla con pasas',
    flavors: ['Vainilla', 'Vainilla con pasas'],
    customizable: true,
    personalizationFields: [dedicatoria, empaque],
    image: publicAsset('/img/keke-de-vainilla.jpg'),
    imageAlt: 'Keke de vainilla en rebanadas con glaseado ligero',
    active: true,
  },
  {
    id: 'keke-de-zanahoria',
    slug: 'keke-de-zanahoria',
    name: 'Keke de zanahoria',
    category: 'clasicos',
    categoryLabel: 'Kekes clásicos',
    description: 'Keke húmedo de zanahoria con nueces y cobertura de queso crema.',
    price: CATALOG_PRICE,
    portions: '10 porciones',
    leadTime: 'Pedido con 48 horas de anticipación',
    flavorsLabel: 'Zanahoria con nueces',
    flavors: [],
    customizable: true,
    personalizationFields: [dedicatoria, empaque],
    image: publicAsset('/img/keke-de-zanahoria.jpg'),
    imageAlt: 'Keke de zanahoria con nueces y cobertura de queso crema sobre tabla de madera',
    active: true,
  },
  {
    id: 'keke-de-limon-y-arandanos',
    slug: 'keke-de-limon-y-arandanos',
    name: 'Keke de limón y arándanos',
    category: 'fechas-especiales',
    categoryLabel: 'Kekes fechas especiales',
    description: 'Keke cítrico con arándanos y glaseado de limón, fresco y aromático.',
    price: CATALOG_PRICE,
    portions: '8 porciones',
    leadTime: 'Pedido con 48 horas de anticipación',
    flavorsLabel: 'Limón, limón con arándanos',
    flavors: ['Limón', 'Limón con arándanos'],
    customizable: true,
    personalizationFields: [dedicatoria, empaque],
    image: publicAsset('/img/keke-de-limon-y-arandanos.jpg'),
    imageAlt: 'Keke de limón con arándanos y glaseado, decorado con frutos rojos',
    active: true,
  },
  {
    id: 'keke-de-cumpleanos',
    slug: 'keke-de-cumpleanos',
    name: 'Keke de cumpleaños',
    category: 'cumpleanos',
    categoryLabel: 'Kekes cumpleaños',
    description: 'Keke decorado con crema en tonos pastel, listo para soplar las velitas.',
    price: CATALOG_PRICE,
    portions: '12 a 15 porciones',
    leadTime: 'Pedido con 3 días de anticipación',
    flavorsLabel: 'A elección: chocolate, vainilla o marmoleado',
    flavors: ['Chocolate', 'Vainilla', 'Marmoleado'],
    customizable: true,
    personalizationFields: [dedicatoria, colores, empaque],
    image: publicAsset('/img/keke-de-cumpleanos.jpg'),
    imageAlt: 'Keke de cumpleaños decorado con crema rosada en tonos pastel y tres velas',
    active: true,
  },
  {
    id: 'keke-para-reuniones',
    slug: 'keke-para-reuniones',
    name: 'Keke para reuniones',
    category: 'reuniones',
    categoryLabel: 'Kekes reuniones',
    description: 'Bandeja de porciones individuales de distintos sabores para compartir.',
    price: CATALOG_PRICE,
    portions: '20 porciones individuales',
    leadTime: 'Pedido con 3 días de anticipación',
    flavorsLabel: 'Surtido: chocolate, vainilla, marmoleado',
    flavors: [],
    customizable: false,
    personalizationFields: [],
    image: publicAsset('/img/keke-para-reuniones.jpg'),
    imageAlt: 'Bandeja con porciones individuales de keke de distintos sabores',
    active: true,
  },
  {
    id: 'keke-personalizado',
    slug: 'keke-personalizado',
    name: 'Keke personalizado',
    category: 'personalizados',
    categoryLabel: 'Kekes personalizados',
    description: 'Keke diseñado a tu medida: colores, dedicatoria, decoración y presentación especial.',
    price: null,
    portions: 'Según el tamaño elegido',
    leadTime: 'Pedido con 5 días de anticipación',
    flavorsLabel: 'A elección del cliente',
    flavors: [],
    customizable: true,
    personalizationFields: [dedicatoria, colores, decoracion, empaque],
    image: publicAsset('/img/keke-personalizado.jpg'),
    imageAlt: 'Keke personalizado color crema decorado con rosas y detalles dorados',
    active: true,
  },
]

export const activeProducts = products.filter((p) => p.active)
export const getProduct = (slug: string) => products.find((p) => p.slug === slug)
export const getProductById = (id: string) => products.find((p) => p.id === id)
export const relatedProducts = (slug: string, max = 3) => activeProducts.filter((p) => p.slug !== slug).slice(0, max)
