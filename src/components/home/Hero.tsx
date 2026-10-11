import { Cake, Clock, Gift, Heart, MapPin, ShieldCheck, Tag, Truck, Wheat } from 'lucide-react'
import { Link } from 'react-router-dom'
import { WhatsAppLink } from '@/components/WhatsAppLink'
import { benefits, heroFacts } from '@/data/site'
import { publicAsset } from '@/utils/assets'

const icons = { tag: Tag, cake: Cake, clock: Clock, pin: MapPin, wheat: Wheat, truck: Truck, shield: ShieldCheck, gift: Gift }

export function Hero() {
  return (
    <section className="bg-gradient-to-b from-crema to-rosa-suave">
      <div className="container-site grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="chip eyebrow !text-[11px]">
            <Heart className="h-4 w-4" aria-hidden="true" />
            Hechos por pedido
          </p>
          <h1 className="mt-4 text-4xl leading-[1.1] sm:text-5xl">Kekes artesanales para acompañar tus momentos especiales.</h1>
          <p className="mt-5 max-w-xl text-lg">
            Preparamos cada pedido con dedicación, cuidando el sabor, la presentación y la entrega. Precio único de S/ 50, todo
            incluido.
          </p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {heroFacts.map((fact) => {
              const Icon = icons[fact.icon]
              return (
                <li key={fact.text} className="chip">
                  <Icon className="h-4 w-4 shrink-0 text-terracota" aria-hidden="true" />
                  {fact.text}
                </li>
              )
            })}
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <WhatsAppLink origin="hero">Pedir por WhatsApp</WhatsAppLink>
            <Link to="/productos" className="btn-secondary">Ver nuestros kekes</Link>
          </div>
        </div>
        <img
          src={publicAsset('/img/hero.jpg')}
          alt="Keke artesanal de chocolate servido en un plato, junto a una taza de té"
          width={540}
          height={404}
          fetchPriority="high"
          className="aspect-[4/3] w-full rounded-card object-cover shadow-card"
        />
      </div>
    </section>
  )
}

export function Benefits() {
  return (
    <section aria-labelledby="beneficios-titulo" className="border-y border-arena bg-marfil py-10">
      <div className="container-site">
        <h2 id="beneficios-titulo" className="sr-only">Por qué elegir Dulce Momento</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => {
            const Icon = icons[b.icon]
            return (
              <li key={b.title} className="flex gap-3 rounded-3xl bg-beige p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-terracota text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg">{b.title}</h3>
                  <p className="mt-0.5 text-sm">{b.text}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
