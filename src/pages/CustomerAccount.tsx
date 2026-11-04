import { LogOut } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Seo } from '@/components/Seo'
import { useCustomerAuth } from '@/contexts/CustomerAuthContext'
import { useAsync } from '@/hooks/useAsync'
import { listMyOrders } from '@/services/customer'
import { formatDate, formatDateTime, formatPrice } from '@/utils/format'
import { orderStatusLabels, paymentMethodLabels, paymentStatusLabels } from '@/data/site'
import { Badge, PageHeader, paymentTone, Status } from '@/admin/components/ui'

export default function CustomerAccount() {
  const { email, profile, signOut } = useCustomerAuth()
  const navigate = useNavigate()
  const orders = useAsync(listMyOrders)

  const logout = async () => {
    await signOut()
    navigate('/cuenta', { replace: true })
  }

  return (
    <section className="section !pt-10">
      <Seo title="Mis pedidos | Dulce Momento" description="Consulta los pedidos de tu cuenta." path="/mi-cuenta" noindex />
      <div className="container-site max-w-5xl">
        <PageHeader eyebrow="Mi cuenta de cliente" title={`Hola${profile?.first_name ? `, ${profile.first_name}` : ''}`}>
          <button type="button" className="btn-ghost btn-sm" onClick={() => void logout()}>
            <LogOut className="mr-1 inline h-4 w-4" aria-hidden="true" />Cerrar sesión
          </button>
        </PageHeader>
        <div className="card mb-6 p-5 text-sm">
          <p><strong className="text-chocolate">Correo de la cuenta:</strong> {email}</p>
          {profile?.phone && <p className="mt-1"><strong className="text-chocolate">Teléfono:</strong> {profile.phone}</p>}
          <p className="mt-2">Aquí puedes consultar tus pedidos. La administración usa un acceso y un panel separados.</p>
        </div>
        <h2 className="mb-4 text-2xl">Mis pedidos</h2>
        <Status loading={orders.loading} error={orders.error} empty={!orders.data?.length && 'Todavía no tienes pedidos.'}>
          <ul className="space-y-4">
            {orders.data?.map((order) => {
              const payment = order.payments[0]
              return (
                <li key={order.id} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-chocolate">Pedido {order.order_code}</h3>
                      <p className="text-sm">{formatDateTime(order.created_at)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={paymentTone[payment?.status ?? 'pendiente']}>
                        Pago: {paymentStatusLabels[payment?.status ?? 'pendiente']}
                      </Badge>
                      <Badge tone="neutral">{orderStatusLabels[order.status]}</Badge>
                    </div>
                  </div>
                  <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                    <div><dt className="text-chocolate-suave">Total</dt><dd className="font-semibold text-chocolate">{formatPrice(Number(order.total))}</dd></div>
                    <div><dt className="text-chocolate-suave">Entrega</dt><dd>{order.delivery_type === 'recojo' ? 'Recojo' : `Delivery · ${order.district ?? 'Por coordinar'}`}</dd></div>
                    <div><dt className="text-chocolate-suave">Fecha solicitada</dt><dd>{formatDate(order.requested_date)}</dd></div>
                  </dl>
                  {payment && <p className="mt-2 text-sm">Método de pago: {paymentMethodLabels[payment.method]}</p>}
                  <ul className="mt-3 space-y-1 text-sm">
                    {order.order_items.map((item) => <li key={item.id}>{item.quantity} × {item.product_name} · {formatPrice(Number(item.subtotal))}</li>)}
                  </ul>
                </li>
              )
            })}
          </ul>
        </Status>
        <Link to="/productos" className="btn-secondary mt-6">Seguir comprando</Link>
      </div>
    </section>
  )
}
