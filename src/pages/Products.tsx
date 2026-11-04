import { Link } from 'react-router-dom'
import { ProductGrid } from '@/components/home/ProductsSection'
import { Seo } from '@/components/Seo'
import { WhatsAppLink } from '@/components/WhatsAppLink'
import { breadcrumbSchema } from '@/utils/structuredData'

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="text-sm">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => (
          <li key={item.path} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">/</span>}
            {i === items.length - 1 ? (
              <span aria-current="page" className="font-semibold text-chocolate">{item.name}</span>
            ) : (
              <Link to={item.path} className="underline underline-offset-4 hover:text-terracota-oscuro">{item.name}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

const crumbs = [
  { name: 'Inicio', path: '/' },
  { name: 'Nuestros kekes', path: '/productos' },
]

export default function Products() {
  return (
    <>
      <Seo
        title="Kekes artesanales en Lima: catálogo y precios | Dulce Momento"
        description="Catálogo de kekes artesanales hechos por pedido: chocolate, vainilla, zanahoria, limón y arándanos, cumpleaños y reuniones. Precio único de S/ 50 y delivery en San Isidro y Lima."
        path="/productos"
        jsonLd={breadcrumbSchema(crumbs)}
      />
      <section className="section !pt-10">
        <div className="container-site">
          <Breadcrumbs items={crumbs} />
          <h1 className="mt-6 text-center text-4xl sm:text-5xl">Nuestros kekes artesanales</h1>
          <p className="section-lead mb-8">
            Cada keke se prepara por pedido. Los kekes del catálogo tienen un precio único de S/ 50, todo incluido; el keke
            personalizado se cotiza según el diseño.
          </p>
          <ProductGrid priority />
          <div className="notice mt-10 flex flex-wrap items-center justify-between gap-4">
            <p>
              ¿Buscas algo distinto? Conoce nuestros{' '}
              <Link to="/kekes-personalizados" className="font-semibold text-terracota-oscuro underline underline-offset-4">
                kekes personalizados
              </Link>{' '}
              o revisa las <Link to="/#preguntas" className="font-semibold text-terracota-oscuro underline underline-offset-4">preguntas frecuentes</Link>.
            </p>
            <WhatsAppLink origin="catalogo" className="btn-primary btn-sm">Consultar por WhatsApp</WhatsAppLink>
          </div>
        </div>
      </section>
    </>
  )
}
