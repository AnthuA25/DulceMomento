import { useState } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { activeProducts, categories } from '@/data/catalog'
import type { CategoryId } from '@/types'

/** Catálogo con filtros por categoría. Lo usan la landing y /productos. */
export function ProductGrid({ priority = false }: { priority?: boolean }) {
  const [filter, setFilter] = useState<CategoryId | 'todos'>('todos')
  const visible = filter === 'todos' ? activeProducts : activeProducts.filter((p) => p.category === filter)
  const filters = [{ id: 'todos' as const, label: 'Todos' }, ...categories]

  return (
    <>
      <div role="group" aria-label="Filtrar kekes por categoría" className="flex flex-wrap justify-center gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`min-h-10 rounded-full border px-4 py-2 text-sm font-medium transition ${
              filter === f.id
                ? 'border-terracota bg-terracota text-white'
                : 'border-arena bg-marfil text-chocolate-medio hover:bg-beige'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">{visible.length} kekes en esta categoría</p>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((product, i) => (
          <li key={product.id}>
            <ProductCard product={product} priority={priority && i < 3} />
          </li>
        ))}
      </ul>
    </>
  )
}

export function ProductsSection() {
  return (
    <section id="kekes" className="section">
      <div className="container-site">
        <h2 className="section-title">Nuestros kekes</h2>
        <p className="section-lead mb-8">Sabores, tamaños y precios. Pide en línea o coordina tu pedido por WhatsApp.</p>
        <ProductGrid />
      </div>
    </section>
  )
}
