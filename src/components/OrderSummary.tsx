import type { ItemOptions } from '@/types'
import { describeOptions } from '@/utils/cart'
import { formatPrice } from '@/utils/format'

interface Line {
  key: string
  name: string
  quantity: number
  subtotal: number
  options: ItemOptions
}

interface Props {
  lines: Line[]
  subtotal: number
  /** null = por confirmar con el cliente. */
  deliveryFee: number | null
  total: number
  pickup?: boolean
  title?: string
}

export function OptionList({ options }: { options: ItemOptions }) {
  const rows = describeOptions(options)
  if (!rows.length) return null
  return (
    <dl className="mt-1 text-xs text-chocolate-medio">
      {rows.map((r) => (
        <div key={r.label} className="flex gap-1">
          <dt className="font-semibold">{r.label}:</dt>
          <dd className="break-words">{r.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Resumen del pedido: productos, cantidad, subtotal, delivery y total. */
export function OrderSummary({ lines, subtotal, deliveryFee, total, pickup, title = 'Resumen del pedido' }: Props) {
  const pending = deliveryFee === null
  return (
    <section aria-labelledby="resumen-titulo" className="card p-6">
      <h2 id="resumen-titulo" className="text-xl">{title}</h2>
      <ul className="mt-4 divide-y divide-arena">
        {lines.map((line) => (
          <li key={line.key} className="flex justify-between gap-4 py-3 text-sm">
            <div>
              <p className="font-semibold text-chocolate">{line.quantity} × {line.name}</p>
              <OptionList options={line.options} />
            </div>
            <p className="shrink-0 font-semibold text-chocolate">{formatPrice(line.subtotal)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-2 space-y-2 border-t border-arena pt-4 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd className="font-semibold text-chocolate">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>{pickup ? 'Recojo' : 'Delivery'}</dt>
          <dd className="font-semibold text-chocolate">{pending ? 'Por confirmar' : deliveryFee === 0 ? 'Sin costo' : formatPrice(deliveryFee)}</dd>
        </div>
        <div className="flex justify-between border-t border-arena pt-3 text-base">
          <dt className="font-bold text-chocolate">Total</dt>
          <dd className="font-display text-xl font-semibold text-chocolate">
            {formatPrice(total)}{pending && <span className="font-sans text-sm font-normal"> + delivery</span>}
          </dd>
        </div>
      </dl>
      {pending && (
        <p className="mt-3 text-xs">El costo de delivery depende de la distancia. Te lo indicamos antes de confirmar tu pedido.</p>
      )}
    </section>
  )
}
