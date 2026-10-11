import { Clock, Heart, ShieldCheck } from 'lucide-react'
import { ContactForm } from '@/components/ContactForm'
import { publicAsset } from '@/utils/assets'

const promises = [
  { icon: Heart, text: 'Te orientamos con sabor y tamaño' },
  { icon: Clock, text: 'Confirmamos disponibilidad para tu fecha' },
  { icon: ShieldCheck, text: 'Garantía de entrega incluida' },
]

export function ContactSection({ heading = 'h2' }: { heading?: 'h1' | 'h2' }) {
  const Heading = heading
  return (
    <section id="contacto" className="section bg-beige">
      <div className="container-site">
        <Heading className="section-title">¿Preparamos algo especial para ti?</Heading>
        <p className="section-lead">Cuéntanos qué necesitas y te ayudaremos a encontrar el keke ideal para tu ocasión.</p>
        <div className="card mt-10 grid overflow-hidden lg:grid-cols-[5fr_6fr]">
          <div className="relative min-h-56 bg-chocolate">
            <img src={publicAsset('/img/galeria-cumpleanos.jpg')} alt="" width={359} height={480} loading="lazy" decoding="async"
              className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-chocolate/90 via-chocolate/30 to-transparent" />
            <div className="relative flex h-full flex-col justify-end p-6 text-white">
              <p className="font-display text-xl font-semibold">Cuéntanos la ocasión y nosotros nos encargamos del resto.</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {promises.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="p-6 sm:p-8">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  )
}
