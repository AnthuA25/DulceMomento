import { collection, getDocs, query, where } from 'firebase/firestore'
import { auth, requireFirestore } from '@/lib/firebase'
import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/types'

export interface CustomerOrder {
  id: string
  order_code: string
  delivery_type: 'delivery' | 'recojo'
  district: string | null
  requested_date: string | null
  total: number
  status: OrderStatus
  created_at: string
  order_items: { id: string; product_name: string; quantity: number; subtotal: number }[]
  payments: { method: PaymentMethod | 'online'; status: PaymentStatus }[]
}

export async function listMyOrders(): Promise<CustomerOrder[]> {
  const user = auth?.currentUser
  if (!user) throw new Error('Inicia sesión con tu cuenta de cliente para ver tus pedidos.')
  const db = requireFirestore()
  const snapshot = await getDocs(query(collection(db, 'orders'), where('customer_uid', '==', user.uid)))
  return snapshot.docs.map((entry) => {
    const data = entry.data()
    return {
      id: entry.id,
      order_code: data.order_code,
      delivery_type: data.delivery_type,
      district: data.district ?? null,
      requested_date: data.requested_date ?? null,
      total: data.total,
      status: data.status,
      created_at: data.created_at,
      order_items: data.order_items ?? [],
      payments: data.payments ?? [],
    }
  }).sort((a, b) => b.created_at.localeCompare(a.created_at))
}
