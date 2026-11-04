import type { CartItem, DeliveryZone, ItemOptions, Product } from '../types/index.ts'

export const MAX_QUANTITY = 20

const round = (n: number) => Math.round(n * 100) / 100

/** Dos líneas son la misma solo si coinciden producto y personalización. */
export function lineId(productId: string, options: ItemOptions): string {
  const entries = Object.entries(options)
    .filter(([, v]) => v !== '' && v !== false)
    .sort(([a], [b]) => a.localeCompare(b))
  return `${productId}::${JSON.stringify(entries)}`
}

export function cleanOptions(options: ItemOptions): ItemOptions {
  const out: ItemOptions = {}
  for (const [k, v] of Object.entries(options)) {
    if (typeof v === 'string' && v.trim()) out[k] = v.trim()
    else if (v === true) out[k] = true
  }
  return out
}

const clamp = (n: number) => Math.min(MAX_QUANTITY, Math.max(1, Math.floor(n) || 1))

export function addItem(items: CartItem[], product: Product, quantity: number, options: ItemOptions): CartItem[] {
  if (product.price === null || !product.active) return items
  const opts = cleanOptions(options)
  const id = lineId(product.id, opts)
  const existing = items.find((i) => i.lineId === id)
  if (existing) {
    return items.map((i) => (i.lineId === id ? { ...i, quantity: clamp(i.quantity + quantity) } : i))
  }
  return [
    ...items,
    {
      lineId: id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      unitPrice: product.price,
      quantity: clamp(quantity),
      options: opts,
    },
  ]
}

export const updateQuantity = (items: CartItem[], id: string, quantity: number): CartItem[] =>
  items.map((i) => (i.lineId === id ? { ...i, quantity: clamp(quantity) } : i))

export const removeItem = (items: CartItem[], id: string): CartItem[] => items.filter((i) => i.lineId !== id)

export const itemCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0)

export const subtotal = (items: CartItem[]) => round(items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0))

/**
 * Costo de delivery: 0 para recojo; la tarifa configurada para el distrito;
 * null cuando todavía debe confirmarse con el cliente.
 */
export function deliveryFee(type: 'delivery' | 'recojo', district: string, zones: DeliveryZone[]): number | null {
  if (type === 'recojo') return 0
  const zone = zones.find((z) => z.name.toLowerCase() === district.trim().toLowerCase())
  return zone?.fee ?? null
}

export function totals(items: CartItem[], fee: number | null) {
  const sub = subtotal(items)
  return { subtotal: sub, deliveryFee: fee, total: round(sub + (fee ?? 0)), feePending: fee === null }
}

const OPTION_LABELS: Record<string, string> = {
  sabor: 'Sabor',
  dedicatoria: 'Dedicatoria',
  colores: 'Colores',
  decoracion: 'Decoración',
  empaque_regalo: 'Empaque para regalo',
}

/** Personalización de una línea, lista para mostrarse. */
export function describeOptions(options: ItemOptions): { label: string; value: string }[] {
  return Object.entries(options)
    .filter(([, v]) => v !== '' && v !== false)
    .map(([k, v]) => ({ label: OPTION_LABELS[k] ?? k, value: v === true ? 'Sí' : String(v) }))
}
