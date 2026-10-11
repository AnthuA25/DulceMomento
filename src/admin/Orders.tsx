import { useState } from 'react'
import { Link } from 'react-router-dom'
import { OptionList } from '@/components/OrderSummary'
import { orderStatusLabels, paymentMethodLabels, paymentStatusLabels } from '@/data/site'
import { useAsync } from '@/hooks/useAsync'
import { listOrders, setOrderStatus, setPaymentStatus } from '@/services/admin'
import type { OrderStatus, PaymentStatus } from '@/types'
import { formatDate, formatDateTime, formatPrice } from '@/utils/format'
import { AdminMeta } from './AdminLayout'
import { Badge, PageHeader, paymentTone, Status } from './components/ui'

export default function Orders() {
  const { data, loading, error, reload } = useAsync(listOrders)
  const [openId, setOpenId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  const run = async (action: () => Promise<unknown>) => {
    setActionError('')
    try {
      await action()
      reload()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'No se pudo guardar el cambio.')
    }
  }

  const verify = (paymentId: string, status: PaymentStatus, code: string) => {
    const text = status === 'pagado'
      ? `¿Confirmas que verificaste el pago del pedido ${code}? El contacto pasará a Cliente.`
      : `¿Marcar el pago del pedido ${code} como rechazado?`
    if (window.confirm(text)) run(() => setPaymentStatus(paymentId, status))
  }

  return (
    <>
      <AdminMeta title="Pedidos" />
      <PageHeader eyebrow="Checkout y pagos" title="Pedidos" />
      {actionError && <p role="alert" className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{actionError}</p>}
      <Status loading={loading && !data} error={error} empty={!data?.length && 'Aún no hay pedidos registrados desde el checkout.'}>
        <ul className="space-y-4">
          {data?.map((o) => {
            const payment = o.payments?.[0]
            const open = openId === o.id
            return (
              <li key={o.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-semibold text-chocolate">{o.order_code}</p>
                    <p className="text-sm">
                      <Link to={`/admin/contactos/${o.contact_id}`} className="font-semibold text-terracota-oscuro underline">
                        {o.contact?.first_name} {o.contact?.last_name}
                      </Link>{' '}· {formatDateTime(o.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {payment && <Badge tone={paymentTone[payment.status]}>Pago: {paymentStatusLabels[payment.status]}</Badge>}
                    <span className="font-display text-xl font-semibold text-chocolate">
                      {formatPrice(Number(o.total))}{o.delivery_fee === null && <span className="font-sans text-xs font-normal"> + delivery</span>}
                    </span>
                    <button type="button" className="btn-ghost btn-sm" aria-expanded={open} aria-controls={`pedido-${o.id}`}
                      onClick={() => setOpenId(open ? null : o.id)}>
                      {open ? 'Ocultar' : 'Ver detalle'}
                    </button>
                  </div>
                </div>

                {open && (
                  <div id={`pedido-${o.id}`} className="mt-5 grid gap-6 border-t border-arena pt-5 lg:grid-cols-3">
                    <div>
                      <h2 className="eyebrow">Productos</h2>
                      <ul className="mt-2 space-y-2 text-sm">
                        {o.order_items?.map((item) => (
                          <li key={item.id}>
                            <p className="font-semibold text-chocolate">{item.quantity} × {item.product_name} · {formatPrice(Number(item.subtotal))}</p>
                            <OptionList options={item.options} />
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-sm">
                      <h2 className="eyebrow">Entrega</h2>
                      <p className="mt-2">{o.delivery_type === 'recojo' ? 'Recojo' : `Delivery · ${o.district ?? '—'}`}</p>
                      {o.address && <p>{o.address}</p>}
                      {o.reference && <p>Ref.: {o.reference}</p>}
                      <p>Fecha solicitada: <strong className="text-chocolate">{formatDate(o.requested_date)}</strong></p>
                      {o.comments && <p className="mt-1 whitespace-pre-line">“{o.comments}”</p>}
                      <p className="mt-1">{o.contact?.email} · {o.contact?.phone ?? 'sin teléfono'}</p>
                      <label htmlFor={`os-${o.id}`} className="label mt-4">Estado del pedido</label>
                      <select id={`os-${o.id}`} className="field" value={o.status}
                        onChange={(e) => run(() => setOrderStatus(o.id, e.target.value as OrderStatus))}>
                        {(Object.keys(orderStatusLabels) as OrderStatus[]).map((s) => <option key={s} value={s}>{orderStatusLabels[s]}</option>)}
                      </select>
                    </div>
                    {payment && (
                      <div className="text-sm">
                        <h2 className="eyebrow">Pago</h2>
                        <p className="mt-2">{paymentMethodLabels[payment.method]} · {formatPrice(Number(payment.amount))}</p>
                        <p>N.º de operación: <strong className="text-chocolate">{payment.operation_number ?? 'no informado'}</strong></p>
                        {payment.verified_at && <p>Revisado el {formatDateTime(payment.verified_at)}</p>}
                        <p className="mt-3 text-xs">Marca el pago como pagado solo después de comprobarlo en tu cuenta.</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {payment.status !== 'pagado' && (
                            <button type="button" className="btn-primary btn-sm" onClick={() => verify(payment.id, 'pagado', o.order_code)}>Marcar como pagado</button>
                          )}
                          {payment.status === 'pendiente' && (
                            <button type="button" className="btn-ghost btn-sm" onClick={() => run(() => setPaymentStatus(payment.id, 'en_verificacion'))}>En verificación</button>
                          )}
                          {payment.status !== 'rechazado' && payment.status !== 'pagado' && (
                            <button type="button" className="btn-ghost btn-sm" onClick={() => verify(payment.id, 'rechazado', o.order_code)}>Rechazar</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </Status>
    </>
  )
}
