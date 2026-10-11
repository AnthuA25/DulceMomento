import { Check, Minus, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PriceTag, ProductCard, ProductFacts } from '@/components/ProductCard'
import { Seo } from '@/components/Seo'
import { WhatsAppLink } from '@/components/WhatsAppLink'
import { useCart } from '@/contexts/CartContext'
import { getProduct, relatedProducts } from '@/data/catalog'
import { track } from '@/lib/analytics'
import { waMessages } from '@/lib/whatsapp'
import type { ItemOptions } from '@/types'
import { MAX_QUANTITY } from '@/utils/cart'
import { breadcrumbSchema, productSchema } from '@/utils/structuredData'
import NotFound from './NotFound'
import { Breadcrumbs } from './Products'

export default function ProductDetail() {
  const { slug = '' } = useParams()
  const product = getProduct(slug)
  const { add } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [options, setOptions] = useState<ItemOptions>({})
  const [showCustom, setShowCustom] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!product) return
    track('view_product', { product_id: product.id, price: product.price })
    setQuantity(1)
    setOptions(product.flavors.length ? { sabor: product.flavors[0] } : {})
    setShowCustom(false)
    setAdded(false)
  }, [product])

  if (!product || !product.active) return <NotFound />

  const crumbs = [
    { name: 'Inicio', path: '/' },
    { name: 'Nuestros kekes', path: '/productos' },
    { name: product.name, path: `/productos/${product.slug}` },
  ]
  const sellable = product.price !== null
  const setOption = (id: string, value: string | boolean) => setOptions((o) => ({ ...o, [id]: value }))

  const handleAdd = () => {
    add(product, quantity, options)
    setAdded(true)
  }

  return (
    <>
      <Seo
        title={`${product.name} artesanal en Lima | Dulce Momento`}
        description={`${product.description} ${product.portions}. ${product.leadTime}. Delivery en San Isidro y Lima.`}
        path={`/productos/${product.slug}`}
        image={product.image}
        type="product"
        jsonLd={[productSchema(product), breadcrumbSchema(crumbs)]}
      />
      <section className="section !pt-10">
        <div className="container-site">
          <Breadcrumbs items={crumbs} />
          <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
            <img src={product.image} alt={product.imageAlt} width={353} height={265} fetchPriority="high"
              className="aspect-[4/3] w-full rounded-card object-cover shadow-card" />

            <div>
              <p className="eyebrow">{product.categoryLabel}</p>
              <h1 className="mt-2 text-4xl sm:text-5xl">{product.name}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <PriceTag product={product} className="text-xl" />
                <span className="badge bg-green-100 text-green-900">Disponible por pedido</span>
              </div>
              <p className="mt-5 text-lg">{product.description}</p>
              <div className="mt-5"><ProductFacts product={product} /></div>

              {sellable && product.flavors.length > 0 && (
                <fieldset className="mt-6">
                  <legend className="label">Sabor</legend>
                  <div className="flex flex-wrap gap-2">
                    {product.flavors.map((flavor) => (
                      <label key={flavor}
                        className="cursor-pointer rounded-full border border-arena bg-marfil px-4 py-2 text-sm font-medium text-chocolate has-[:checked]:border-terracota has-[:checked]:bg-rosa-pastel has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-terracota">
                        <input type="radio" name="sabor" value={flavor} checked={options.sabor === flavor}
                          onChange={() => setOption('sabor', flavor)} className="sr-only" />
                        {flavor}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              {sellable && showCustom && (
                <fieldset id="personalizacion" className="mt-6 space-y-4 rounded-3xl bg-beige p-5">
                  <legend className="float-left mb-1 w-full font-display text-lg font-semibold text-chocolate">Personaliza tu keke</legend>
                  <div className="clear-both" />
                  {product.personalizationFields.map((field) =>
                    field.type === 'checkbox' ? (
                      <label key={field.id} htmlFor={`opt-${field.id}`} className="flex items-center gap-3 text-sm text-chocolate">
                        <input id={`opt-${field.id}`} type="checkbox" className="h-4 w-4 accent-terracota"
                          checked={options[field.id] === true} onChange={(e) => setOption(field.id, e.target.checked)} />
                        {field.label}
                      </label>
                    ) : (
                      <div key={field.id}>
                        <label htmlFor={`opt-${field.id}`} className="label">{field.label}</label>
                        <input id={`opt-${field.id}`} className="field" maxLength={field.maxLength} placeholder={field.placeholder}
                          value={String(options[field.id] ?? '')} onChange={(e) => setOption(field.id, e.target.value)} />
                      </div>
                    ),
                  )}
                  <p className="text-xs">Tus elecciones se guardan con el producto en el carrito. Confirmamos los detalles contigo antes de preparar tu pedido.</p>
                </fieldset>
              )}

              {sellable && (
                <div className="mt-6">
                  <span id="cantidad-label" className="label">Cantidad</span>
                  <div className="inline-flex items-center rounded-full border border-arena bg-marfil" role="group" aria-labelledby="cantidad-label">
                    <button type="button" aria-label="Reducir cantidad" disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-chocolate hover:bg-beige disabled:opacity-40">
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <output aria-live="polite" className="w-10 text-center font-bold text-chocolate">{quantity}</output>
                    <button type="button" aria-label="Aumentar cantidad" disabled={quantity >= MAX_QUANTITY}
                      onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-chocolate hover:bg-beige disabled:opacity-40">
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-7 flex flex-wrap gap-3">
                {sellable ? (
                  <>
                    <button type="button" className="btn-primary" onClick={handleAdd}>Agregar al carrito</button>
                    {product.customizable && !showCustom && (
                      <button type="button" className="btn-secondary" aria-expanded={false} onClick={() => setShowCustom(true)}>
                        Personalizar
                      </button>
                    )}
                  </>
                ) : (
                  <Link to={`/contacto?producto=${product.slug}&tipo=keke_personalizado`} className="btn-primary">Solicitar cotización</Link>
                )}
                <WhatsAppLink origin={`producto:${product.slug}`} message={waMessages.product(product.name)} className="btn-ghost">
                  Consultar por WhatsApp
                </WhatsAppLink>
              </div>

              <div aria-live="polite">
                {added && (
                  <p className="notice mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="flex items-center gap-2 font-semibold text-chocolate">
                      <Check className="h-4 w-4 text-green-700" aria-hidden="true" />
                      Agregado al carrito
                    </span>
                    <Link to="/carrito" className="font-semibold text-terracota-oscuro underline underline-offset-4">Ver carrito</Link>
                    <Link to="/productos" className="underline underline-offset-4">Seguir comprando</Link>
                  </p>
                )}
              </div>

              {!sellable && (
                <p className="notice mt-5">
                  El precio de este keke depende del diseño y el tamaño. Cuéntanos tu idea y te enviamos una cotización.{' '}
                  <Link to="/kekes-personalizados" className="font-semibold text-terracota-oscuro underline underline-offset-4">
                    Ver opciones de personalización
                  </Link>
                </p>
              )}
            </div>
          </div>

          <h2 className="mt-16 text-3xl">También te puede gustar</h2>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProducts(product.slug).map((p) => (
              <li key={p.id}><ProductCard product={p} /></li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
