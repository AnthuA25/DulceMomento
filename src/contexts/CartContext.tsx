import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getProductById } from '@/data/catalog'
import { track } from '@/lib/analytics'
import type { CartItem, ItemOptions, Product } from '@/types'
import * as cart from '@/utils/cart'

const STORAGE_KEY = 'dulce-momento:carrito'

interface CartContextValue {
  items: CartItem[]
  count: number
  subtotal: number
  add: (product: Product, quantity: number, options: ItemOptions) => void
  setQuantity: (lineId: string, quantity: number) => void
  remove: (lineId: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

/** Lee el carrito guardado y lo revalida contra el catálogo (precio y disponibilidad actuales). */
function load(): CartItem[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as CartItem[]
    return stored.flatMap((item) => {
      const product = getProductById(item.productId)
      if (!product || !product.active || product.price === null) return []
      return [{ ...item, name: product.name, image: product.image, unitPrice: product.price }]
    })
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch { /* almacenamiento no disponible: el carrito vive solo en memoria */ }
  }, [items])

  const add = useCallback((product: Product, quantity: number, options: ItemOptions) => {
    setItems((current) => cart.addItem(current, product, quantity, options))
    track('add_to_cart', {
      currency: 'PEN',
      value: (product.price ?? 0) * quantity,
      items: [{ item_id: product.id, item_name: product.name, item_category: product.category, price: product.price ?? 0, quantity }],
    })
  }, [])
  const setQuantity = useCallback((id: string, q: number) => {
    const item = items.find((entry) => entry.lineId === id)
    if (item && q !== item.quantity) {
      const quantity = Math.abs(q - item.quantity)
      track(q > item.quantity ? 'add_to_cart' : 'remove_from_cart', {
        currency: 'PEN',
        value: item.unitPrice * quantity,
        items: [{ item_id: item.productId, item_name: item.name, price: item.unitPrice, quantity }],
      })
    }
    setItems((current) => cart.updateQuantity(current, id, q))
  }, [items])
  const remove = useCallback((id: string) => {
    const item = items.find((entry) => entry.lineId === id)
    if (item) track('remove_from_cart', {
      currency: 'PEN',
      value: item.unitPrice * item.quantity,
      items: [{ item_id: item.productId, item_name: item.name, price: item.unitPrice, quantity: item.quantity }],
    })
    setItems((current) => cart.removeItem(current, id))
  }, [items])
  const clear = useCallback(() => {
    if (items.length) track('remove_from_cart', {
      currency: 'PEN',
      value: cart.subtotal(items),
      items: items.map((item) => ({
        item_id: item.productId, item_name: item.name, price: item.unitPrice, quantity: item.quantity,
      })),
    })
    setItems([])
  }, [items])

  const value = useMemo(
    () => ({ items, count: cart.itemCount(items), subtotal: cart.subtotal(items), add, setQuantity, remove, clear }),
    [items, add, setQuantity, remove, clear],
  )
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
