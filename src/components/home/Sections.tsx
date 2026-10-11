import { Info, Quote, Sparkles, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { WhatsAppLink } from '@/components/WhatsAppLink'
import { personalizationOptions } from '@/data/catalog'
import { deliveryInfo, demoTestimonials, gallery, occasions, steps } from '@/data/site'
import { waMessages } from '@/lib/whatsapp'
import { publicAsset } from '@/utils/assets'

export function Personalization() {
  return (
    <section id="personalizacion" className="section bg-beige">
      <div className="container-site grid items-center gap-10 lg:grid-cols-2">
        <img
          src={publicAsset('/img/personalizacion.jpg')}
          alt="Keke personalizado color crema decorado con rosas naturales y detalles dorados"
          width={540}
          height={538}
          loading="lazy"
          decoding="async"
          className="aspect-square w-full rounded-card object-cover shadow-card"
        />
        <div>
          <h2 className="text-3xl sm:text-4xl">Hazlo único para tu momento</h2>
          <p className="mt-4">
            Muchos de nuestros pedidos se personalizan para que el keke tenga el detalle exacto que imaginas. Cuéntanos la
            ocasión y lo preparamos a tu medida.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {personalizationOptions.map((option) => (
              <li key={option} className="chip">
                <Sparkles className="h-4 w-4 text-terracota-claro" aria-hidden="true" />
                {option}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3">
            <WhatsAppLink origin="personalizacion" message={waMessages.personalize}>Personalizar mi keke</WhatsAppLink>
            <Link to="/kekes-personalizados" className="text-sm font-semibold text-terracota-oscuro underline underline-offset-4">
              Ver más sobre kekes personalizados
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Occasions() {
  return (
    <section id="ocasiones" className="section">
      <div className="container-site">
        <h2 className="section-title">Un keke para cada momento</h2>
        <p className="section-lead">Elige la ocasión y te ayudamos a encontrar la mejor opción del catálogo.</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {occasions.map((o) => (
            <li key={o.title} className="card flex flex-col items-center p-6 text-center">
              <span className="text-3xl" aria-hidden="true">{o.emoji}</span>
              <h3 className="mt-3 text-xl">{o.title}</h3>
              <p className="mb-5 mt-2 text-sm">{o.text}</p>
              <WhatsAppLink origin={`ocasion:${o.title}`} message={waMessages.occasion(o.title)} className="btn-secondary mt-auto w-full">
                Consultar<span className="sr-only"> por {o.title}</span>
              </WhatsAppLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function Steps() {
  return (
    <section id="como-funciona" className="section bg-beige">
      <div className="container-site">
        <h2 className="section-title">Tu keke en 3 pasos</h2>
        <p className="section-lead">Todo el proceso se coordina de forma sencilla y personalizada.</p>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-terracota font-display text-lg font-semibold text-white" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="mt-4 text-xl">{step.title}</h3>
              <p className="mt-2 text-sm">{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <WhatsAppLink origin="pasos">Escribirnos por WhatsApp</WhatsAppLink>
          <Link to="/productos" className="btn-ghost">Pedir en línea</Link>
        </div>
      </div>
    </section>
  )
}

export function Testimonials() {
  return (
    <section id="testimonios" className="section">
      <div className="container-site">
        <h2 className="section-title">Lo que dicen nuestros clientes</h2>
        <p className="notice mx-auto mt-6 flex w-fit max-w-full items-center gap-2 rounded-full">
          <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
          Estos testimonios son demostrativos y deben reemplazarse por opiniones reales de clientes.
        </p>
        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {demoTestimonials.map((t) => (
            <li key={t.name} className="card flex flex-col p-6">
              <Quote className="h-5 w-5 text-terracota" aria-hidden="true" />
              <blockquote className="mt-3 flex-1 text-sm">“{t.text}”</blockquote>
              <p className="mt-4 font-display font-semibold text-chocolate">
                {t.name} <span className="ml-1 font-sans text-xs font-normal text-chocolate-suave">Testimonio demostrativo</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function Gallery() {
  return (
    <section id="galeria" className="section bg-beige">
      <div className="container-site">
        <h2 className="section-title">Galería</h2>
        <p className="section-lead">Diseños, presentaciones y pedidos que hemos preparado.</p>
        <ul className="mt-10 columns-2 gap-4 md:columns-3">
          {gallery.map((photo) => (
            <li key={photo.src} className="mb-4 break-inside-avoid">
              <img src={photo.src} alt={photo.alt} width={photo.w} height={photo.h} loading="lazy" decoding="async"
                className="w-full rounded-3xl shadow-card" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function Delivery() {
  return (
    <section id="delivery" className="section bg-beige">
      <div className="container-site">
        <div className="card mx-auto max-w-4xl p-6 sm:p-9">
          <Truck className="h-7 w-7 text-terracota" aria-hidden="true" />
          <h2 className="mt-3 text-3xl sm:text-4xl">Delivery</h2>
          <p className="mt-2">
            Zona principal: <strong className="text-chocolate">San Isidro</strong> · Lima y distritos alrededores (se confirma por
            WhatsApp)
          </p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {deliveryInfo.map((item) => (
              <div key={item.title} className="rounded-3xl bg-beige p-4">
                <dt className="text-sm font-bold text-chocolate">{item.title}</dt>
                <dd className="mt-1 text-sm">{item.text}</dd>
              </div>
            ))}
          </dl>
          <WhatsAppLink origin="delivery" message={waMessages.delivery} className="btn-primary mt-7">Consultar mi dirección</WhatsAppLink>
        </div>
      </div>
    </section>
  )
}

export function FinalCta() {
  return (
    <section className="bg-gradient-to-b from-crema to-rosa-suave py-20 text-center">
      <div className="container-site">
        <h2 className="text-3xl sm:text-4xl">¿Se te antojó? Horneamos el tuyo.</h2>
        <p className="section-lead">Elige tu keke en línea o escríbenos por WhatsApp y coordinamos sabor, tamaño y entrega para tu próximo momento especial.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <WhatsAppLink origin="cta-final">Pedir mi keke por WhatsApp</WhatsAppLink>
          <Link to="/productos" className="btn-ghost">Ver el catálogo</Link>
        </div>
      </div>
    </section>
  )
}
