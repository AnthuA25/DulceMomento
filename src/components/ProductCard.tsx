import { Cake, Check, Clock, ShoppingBag, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { WhatsAppLink } from '@/components/WhatsAppLink'
import { useCart } from '@/contexts/CartContext'
import { waMessages } from '@/lib/whatsapp'
import type { Product } from '@/types'
import { formatPrice } from '@/utils/format'

export function PriceTag({ product, className = '' }: { product: Product; className?: string }) {
  return (
    <span className={`shrink-0 rounded-full bg-rosa-pastel px-3 py-1 font-display font-semibold text-chocolate ${className}`}>
      {product.price === null ? 'Precio según diseño' : formatPrice(product.price)}
    </span>
  )
}

export function ProductFacts({ product }: { product: Product }) {
  const rows = [
    { icon: Cake, text: product.flavorsLabel },
    { icon: Users, text: product.portions },
    { icon: Clock, text: product.leadTime },
  ]
  return (
    <ul className="space-y-1.5 text-sm text-chocolate">
      {rows.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-start gap-2">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-terracota" aria-hidden="true" />
          {text}
        </li>
      ))}
    </ul>
  )
}

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)
  const detail = `/productos/${product.slug}`
  // Si hay que elegir sabor, la compra continúa en la página del producto.
  const quickAdd = product.price !== null && product.flavors.length === 0

  const handleAdd = () => {
    add(product, 1, {})
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <article className="card flex h-full flex-col overflow-hidden">
      <Link to={detail} tabIndex={-1} aria-hidden="true">
        <img
          src={product.image}
          alt=""
          width={353}
          height={265}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="aspect-[4/3] w-full object-cover"
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="eyebrow pt-1.5">{product.categoryLabel}</p>
          <PriceTag product={product} />
        </div>
        <h3 className="mt-1 text-xl">
          <Link to={detail} className="hover:text-terracota-oscuro">{product.name}</Link>
        </h3>
        <p className="mt-2 text-sm">{product.description}</p>
        <div className="mb-5 mt-4"><ProductFacts product={product} /></div>

        <div className="mt-auto grid gap-2">
          <Link to={detail} className="btn-primary w-full">Quiero este keke</Link>
          <div className="grid grid-cols-2 gap-2">
            {product.price === null ? (
              <Link to={`/contacto?producto=${product.slug}&tipo=keke_personalizado`} className="btn-ghost btn-sm">
                Cotizar
              </Link>
            ) : quickAdd ? (
              <button type="button" className="btn-ghost btn-sm" onClick={handleAdd} aria-live="polite">
                {added ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingBag className="h-4 w-4" aria-hidden="true" />}
                {added ? 'Agregado' : 'Al carrito'}
              </button>
            ) : (
              <Link to={detail} className="btn-ghost btn-sm">
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                Al carrito
              </Link>
            )}
            <WhatsAppLink origin={`card:${product.slug}`} message={waMessages.product(product.name)} className="btn-ghost btn-sm">
              WhatsApp
            </WhatsAppLink>
          </div>
        </div>
      </div>
    </article>
  )
}
