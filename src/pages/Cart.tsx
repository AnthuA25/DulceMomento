import { Minus, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { OptionList, OrderSummary } from '@/components/OrderSummary'
import { Seo } from '@/components/Seo'
import { useCart } from '@/contexts/CartContext'
import { MAX_QUANTITY, totals } from '@/utils/cart'
import { formatPrice } from '@/utils/format'

export default function Cart() {
  const { items, setQuantity, remove, clear } = useCart()
  // El delivery se calcula en el checkout, cuando se conoce el distrito.
  const t = totals(items, null)

  return (
    <section className="section !pt-10">
      <Seo title="Tu carrito | Dulce Momento" description="Revisa los kekes de tu pedido." path="/carrito" noindex />
      <div className="container-site">
        <h1 className="text-4xl">Tu carrito</h1>

        {items.length === 0 ? (
          <div className="card mt-8 p-10 text-center">
            <p className="text-lg text-chocolate">Tu carrito está vacío.</p>
            <Link to="/productos" className="btn-primary mt-5">Ver nuestros kekes</Link>
          </div>
        ) : (
          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
            <div>
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.lineId} className="card flex gap-4 p-4">
                    <img src={item.image} alt="" width={96} height={96} loading="lazy" className="h-20 w-20 shrink-0 rounded-2xl object-cover sm:h-24 sm:w-24" />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-3">
                        <h2 className="text-lg">
                          <Link to={`/productos/${item.slug}`} className="hover:text-terracota-oscuro">{item.name}</Link>
                        </h2>
                        <p className="shrink-0 font-display text-lg font-semibold text-chocolate">{formatPrice(item.unitPrice * item.quantity)}</p>
                      </div>
                      <p className="text-sm">{formatPrice(item.unitPrice)} c/u</p>
                      <OptionList options={item.options} />
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-full border border-arena bg-crema" role="group" aria-label={`Cantidad de ${item.name}`}>
                          <button type="button" aria-label="Reducir cantidad" disabled={item.quantity <= 1}
                            onClick={() => setQuantity(item.lineId, item.quantity - 1)}
                            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-beige disabled:opacity-40">
                            <Minus className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <output aria-live="polite" className="w-8 text-center font-bold text-chocolate">{item.quantity}</output>
                          <button type="button" aria-label="Aumentar cantidad" disabled={item.quantity >= MAX_QUANTITY}
                            onClick={() => setQuantity(item.lineId, item.quantity + 1)}
                            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-beige disabled:opacity-40">
                            <Plus className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                        <button type="button" onClick={() => remove(item.lineId)}
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-red-800 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          Eliminar<span className="sr-only"> {item.name}</span>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap justify-between gap-3">
                <Link to="/productos" className="btn-ghost btn-sm">Continuar comprando</Link>
                <button type="button" className="btn-ghost btn-sm" onClick={() => window.confirm('¿Vaciar el carrito?') && clear()}>
                  Vaciar carrito
                </button>
              </div>
            </div>

            <div className="space-y-4 lg:sticky lg:top-24">
              <OrderSummary
                lines={items.map((i) => ({ key: i.lineId, name: i.name, quantity: i.quantity, subtotal: i.unitPrice * i.quantity, options: {} }))}
                subtotal={t.subtotal} deliveryFee={t.deliveryFee} total={t.total}
              />
              <Link to="/checkout" className="btn-primary w-full">Ir al checkout</Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
