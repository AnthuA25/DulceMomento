import { Link, Navigate, useLocation } from 'react-router-dom'
import { OrderSummary } from '@/components/OrderSummary'
import { Seo } from '@/components/Seo'
import { WhatsAppLink } from '@/components/WhatsAppLink'
import { useSettings } from '@/contexts/SettingsContext'
import { paymentMethodLabels, paymentStatusLabels } from '@/data/site'
import { waMessages } from '@/lib/whatsapp'
import { paymentDetails } from '@/services/payments'
import type { OrderResult } from '@/types'
import { SuccessIcon, SummaryList } from './Thanks'

export default function OrderConfirmed() {
  const order = useLocation().state as OrderResult | null
  const settings = useSettings()
  if (!order?.order_code) return <Navigate to="/productos" replace />

  const details = paymentDetails(order.payment_method, settings)

  return (
    <section className="section">
      <Seo title="Pedido registrado | Dulce Momento" description="Registramos tu pedido." path="/pedido-confirmado" noindex />
      <div className="container-site max-w-2xl">
        <div className="text-center">
          <SuccessIcon />
          <h1 className="mt-5 text-4xl">¡Registramos tu pedido!</h1>
          <p className="mt-3 text-lg">
            Gracias, {order.first_name}. Tu pedido queda confirmado cuando verificamos el pago; te contactaremos para coordinar la
            entrega.
          </p>
        </div>

        <div className="card mt-8 p-6">
          <h2 className="eyebrow">Tu pedido</h2>
          <SummaryList rows={[
            ['Código', order.order_code],
            ['Entrega', order.delivery_type === 'recojo' ? 'Recojo' : `Delivery · ${order.district ?? ''}`],
            ['Pago', paymentMethodLabels[order.payment_method]],
            ['Estado del pago', paymentStatusLabels[order.payment_status]],
          ]} />
          {order.payment_status === 'pendiente' && (
            <div className="notice mt-4">
              <p className="font-semibold text-chocolate">Para completar tu pago con {paymentMethodLabels[order.payment_method]}:</p>
              {details.length ? (
                <dl className="mt-2 grid gap-1">
                  {details.map(([label, value]) => (
                    <div key={label} className="flex gap-3"><dt className="w-16">{label}</dt><dd className="font-bold text-chocolate">{value}</dd></div>
                  ))}
                </dl>
              ) : (
                <p className="mt-1">Te enviaremos los datos de pago por WhatsApp.</p>
              )}
              <p className="mt-2">Luego envíanos tu número de operación indicando el código {order.order_code}.</p>
            </div>
          )}
          {order.payment_status === 'en_verificacion' && (
            <p className="notice mt-4">Recibimos tu número de operación. Te avisaremos cuando verifiquemos el pago.</p>
          )}
        </div>

        <div className="mt-6">
          <OrderSummary
            title="Resumen"
            lines={order.items.map((i, n) => ({ key: String(n), name: i.product_name, quantity: i.quantity, subtotal: Number(i.subtotal), options: i.options }))}
            subtotal={Number(order.subtotal)}
            deliveryFee={order.delivery_fee === null ? null : Number(order.delivery_fee)}
            total={Number(order.total)}
            pickup={order.delivery_type === 'recojo'}
          />
        </div>

        {order.email_sent && (
          <p className="mt-5 text-center text-sm" role="status">También enviamos una confirmación a <strong className="text-chocolate">{order.email}</strong>.</p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <WhatsAppLink origin="pedido-confirmado" message={waMessages.order(order.order_code)}>Coordinar por WhatsApp</WhatsAppLink>
          <Link to="/" className="btn-secondary">Volver al inicio</Link>
        </div>
      </div>
    </section>
  )
}
