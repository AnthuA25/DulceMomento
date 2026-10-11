import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { faqData, type FaqItem } from '@/data/faq'

/**
 * Preguntas frecuentes en formato AEO: pregunta → respuesta directa → detalle → CTA.
 * Las respuestas permanecen en el HTML aunque estén plegadas, para que buscadores
 * y asistentes puedan leerlas.
 */
export function Faq({ items = faqData, headingLevel = 'h3' }: { items?: FaqItem[]; headingLevel?: 'h3' | 'h4' }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const Heading = headingLevel

  return (
    <div className="mx-auto max-w-3xl">
      {items.map((item) => {
        const open = openId === item.id
        return (
          <div key={item.id} className="border-b border-arena">
            <Heading className="font-display text-lg font-medium">
              <button
                type="button"
                id={`faq-btn-${item.id}`}
                aria-expanded={open}
                aria-controls={`faq-panel-${item.id}`}
                onClick={() => setOpenId(open ? null : item.id)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left text-chocolate hover:text-terracota-oscuro"
              >
                {item.question}
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-chocolate-suave transition-transform ${open ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
            </Heading>
            <div id={`faq-panel-${item.id}`} role="region" aria-labelledby={`faq-btn-${item.id}`} hidden={!open} className="pb-5">
              <p className="font-semibold text-chocolate">{item.answer}</p>
              <p className="mt-2">{item.detail}</p>
              <Link to={item.cta.to} className="mt-3 inline-block font-semibold text-terracota-oscuro underline underline-offset-4">
                {item.cta.label}
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
