import { Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Faq } from '@/components/Faq'
import { ProductCard } from '@/components/ProductCard'
import { Seo } from '@/components/Seo'
import { WhatsAppLink } from '@/components/WhatsAppLink'
import { activeProducts, personalizationOptions } from '@/data/catalog'
import { deliveryInfo, steps } from '@/data/site'
import { waMessages } from '@/lib/whatsapp'
import { breadcrumbSchema, faqSchema } from '@/utils/structuredData'
import { publicAsset } from '@/utils/assets'
import { Breadcrumbs } from './Products'

const crumbs = [
  { name: 'Inicio', path: '/' },
  { name: 'Kekes personalizados', path: '/kekes-personalizados' },
]

const featured = activeProducts.filter((p) => ['personalizados', 'cumpleanos', 'reuniones'].includes(p.category))

/** Página SEO/AEO: cada bloque responde una pregunta con respuesta directa, detalle y CTA. */
export default function Personalizados() {
  return (
    <>
      <Seo
        title="Kekes Personalizados en Lima | Dulce Momento"
        description="Kekes personalizados en Lima con dedicatoria, colores y decoración a tu medida. Hechos por pedido para cumpleaños y momentos especiales, con delivery en San Isidro y alrededores."
        path="/kekes-personalizados"
        image={publicAsset('/img/personalizacion.jpg')}
        jsonLd={[breadcrumbSchema(crumbs), faqSchema()]}
      />

      <section className="bg-gradient-to-b from-crema to-rosa-suave">
        <div className="container-site py-10">
          <Breadcrumbs items={crumbs} />
          <div className="mt-6 grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="eyebrow">Kekes personalizados en Lima</p>
              <h1 className="mt-3 text-4xl leading-[1.1] sm:text-5xl">Kekes personalizados para cada ocasión</h1>
              <p className="mt-5 text-lg">
                Diseñamos tu keke a medida: tú eliges colores, dedicatoria, decoración y presentación. Lo preparamos por pedido
                y lo entregamos por delivery en San Isidro, Lima y distritos alrededores.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/contacto?tipo=keke_personalizado&producto=keke-personalizado" className="btn-primary">Solicitar cotización</Link>
                <WhatsAppLink origin="personalizados-hero" message={waMessages.personalize} className="btn-secondary">
                  Personalizar por WhatsApp
                </WhatsAppLink>
              </div>
            </div>
            <img src={publicAsset('/img/personalizacion.jpg')} alt="Keke personalizado color crema decorado con rosas y detalles dorados"
              width={540} height={538} fetchPriority="high" className="aspect-[4/3] w-full rounded-card object-cover shadow-card" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-site">
          <h2 className="section-title">Opciones de personalización</h2>
          <p className="section-lead">
            Puedes personalizar seis aspectos de tu keke. Cuéntanos la ocasión y te orientamos con cada uno.
          </p>
          <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-3">
            {personalizationOptions.map((option) => (
              <li key={option} className="chip !px-5 !py-3 text-base">
                <Sparkles className="h-4 w-4 text-terracota-claro" aria-hidden="true" />
                {option}
              </li>
            ))}
          </ul>
          <p className="section-lead">
            El keke personalizado se cotiza según el diseño y se pide con 5 días de anticipación. Los kekes del catálogo también
            permiten indicar dedicatoria y empaque para regalo al hacer el pedido.
          </p>
        </div>
      </section>

      <section className="section bg-beige">
        <div className="container-site">
          <h2 className="section-title">Kekes para cumpleaños y momentos especiales</h2>
          <p className="section-lead">
            Para cumpleaños recomendamos el keke decorado con crema en tonos pastel, de 12 a 15 porciones. Para oficina y
            reuniones, la bandeja de 20 porciones individuales.
          </p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
          </ul>
          <p className="mt-8 text-center">
            <Link to="/productos" className="font-semibold text-terracota-oscuro underline underline-offset-4">Ver todo el catálogo de kekes</Link>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container-site">
          <h2 className="section-title">Cómo realizar tu pedido</h2>
          <p className="section-lead">Son tres pasos: nos escribes, lo preparamos y lo recibes.</p>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="card p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-terracota font-display text-lg font-semibold text-white" aria-hidden="true">{i + 1}</span>
                <h3 className="mt-4 text-xl">{step.title}</h3>
                <p className="mt-2 text-sm">{step.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 text-center">
            <Link to="/contacto?tipo=keke_personalizado&producto=keke-personalizado" className="btn-primary">Empezar mi pedido</Link>
          </div>
        </div>
      </section>

      <section className="section bg-beige">
        <div className="container-site">
          <h2 className="section-title">Delivery</h2>
          <p className="section-lead">
            Sí hacemos delivery. La zona principal es San Isidro y también llegamos a Lima y distritos alrededores.
          </p>
          <dl className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2">
            {deliveryInfo.map((item) => (
              <div key={item.title} className="card p-5">
                <dt className="font-bold text-chocolate">{item.title}</dt>
                <dd className="mt-1 text-sm">{item.text}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 text-center">
            <WhatsAppLink origin="personalizados-delivery" message={waMessages.delivery}>Consultar mi dirección</WhatsAppLink>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-site">
          <h2 className="section-title mb-8">Preguntas frecuentes</h2>
          <Faq />
        </div>
      </section>
    </>
  )
}
