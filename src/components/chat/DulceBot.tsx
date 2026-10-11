import { Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { WhatsAppLink } from '@/components/WhatsAppLink'
import { activeProducts } from '@/data/catalog'
import { faqData, getFaq, matchFaq, type FaqItem } from '@/data/faq'
import { track } from '@/lib/analytics'
import { formatPrice } from '@/utils/format'
import { LeadForm } from './LeadForm'

interface Message {
  id: number
  from: 'bot' | 'user'
  text?: string
  faq?: FaqItem
  view?: 'products' | 'faq-list' | 'lead' | 'whatsapp'
}

type Option = { label: string; run: () => Omit<Message, 'id' | 'from'> }

// Todas las respuestas salen de faqData y del catálogo: el bot no improvisa.
const options: Option[] = [
  { label: 'Ver kekes', run: () => ({ text: 'Estos son nuestros kekes:', view: 'products' }) },
  { label: 'Precios', run: () => ({ faq: getFaq('precios') }) },
  { label: 'Porciones', run: () => ({ faq: getFaq('porciones') }) },
  { label: 'Personalización', run: () => ({ faq: getFaq('personalizacion') }) },
  { label: 'Delivery', run: () => ({ faq: getFaq('delivery') }) },
  { label: 'Preguntas frecuentes', run: () => ({ text: 'Elige una pregunta:', view: 'faq-list' }) },
  { label: 'Hacer pedido', run: () => ({ faq: getFaq('pedido'), view: 'lead' }) },
  { label: 'Hablar por WhatsApp', run: () => ({ text: 'Te atendemos directamente por WhatsApp:', view: 'whatsapp' }) },
]

const welcome: Message = {
  id: 0,
  from: 'bot',
  text: '¡Hola! Soy Dulce Bot 🍰 Puedo contarte sobre nuestros kekes, precios, porciones, personalización y delivery. ¿Qué te gustaría saber?',
}

export default function DulceBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([welcome])
  const [input, setInput] = useState('')
  const nextId = useRef(1)
  const logRef = useRef<HTMLDivElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [messages, open])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const push = (...items: Omit<Message, 'id'>[]) =>
    setMessages((current) => [...current, ...items.map((m) => ({ ...m, id: nextId.current++ }))])

  const toggle = () => {
    if (!open) track('chatbot_open')
    setOpen((v) => !v)
  }
  const close = () => {
    setOpen(false)
    launcherRef.current?.focus()
  }

  const choose = (option: Option) => push({ from: 'user', text: option.label }, { from: 'bot', ...option.run() })

  const ask = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setInput('')
    const faq = matchFaq(text)
    push(
      { from: 'user', text },
      faq
        ? { from: 'bot', faq }
        : {
            from: 'bot',
            text: 'No tengo esa respuesta todavía. Déjanos tus datos y te contactamos, o escríbenos por WhatsApp.',
            view: 'lead',
          },
    )
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="dulce-bot"
        className="fixed bottom-4 left-4 z-30 inline-flex min-h-12 items-center gap-2 rounded-full border border-arena bg-marfil py-1.5 pl-1.5 pr-4 text-sm font-semibold text-chocolate shadow-lg hover:bg-beige"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rosa-pastel text-lg" aria-hidden="true">👩‍🍳</span>
        <span className={open ? '' : 'sr-only sm:not-sr-only'}>{open ? 'Cerrar chat' : '¿Necesitas ayuda?'}</span>
      </button>

      {open && (
        <section
          id="dulce-bot"
          role="dialog"
          aria-label="Dulce Bot, asistente de Dulce Momento"
          className="fixed inset-x-3 bottom-20 z-40 flex max-h-[min(34rem,calc(100dvh-6.5rem))] flex-col overflow-hidden rounded-card border border-arena bg-crema shadow-2xl sm:inset-x-auto sm:left-4 sm:w-[23rem]"
        >
          <header className="flex items-center justify-between bg-gradient-to-r from-terracota to-terracota-claro px-4 py-3 text-white">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">Dulce Bot</h2>
              <p className="text-xs text-white/90">Asistente de Dulce Momento</p>
            </div>
            <button type="button" onClick={close} aria-label="Cerrar chat" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/20">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </header>

          <div ref={logRef} role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {messages.map((m) => (
              <div key={m.id} className={m.from === 'user' ? 'flex justify-end' : ''}>
                <div className={m.from === 'user'
                  ? 'max-w-[85%] rounded-2xl rounded-br-md bg-terracota px-3.5 py-2 text-white'
                  : 'max-w-[92%] rounded-2xl rounded-bl-md border border-arena bg-marfil px-3.5 py-2.5 text-chocolate'}>
                  {m.text && <p>{m.text}</p>}
                  {m.faq && (
                    <>
                      <p className="font-semibold">{m.faq.answer}</p>
                      <p className="mt-1.5 text-chocolate-medio">{m.faq.detail}</p>
                      <Link to={m.faq.cta.to} onClick={() => setOpen(false)} className="mt-2 inline-block font-semibold text-terracota-oscuro underline underline-offset-4">
                        {m.faq.cta.label}
                      </Link>
                    </>
                  )}
                  {m.view === 'products' && (
                    <ul className="mt-2 space-y-1.5">
                      {activeProducts.map((p) => (
                        <li key={p.id}>
                          <Link to={`/productos/${p.slug}`} onClick={() => setOpen(false)} className="flex justify-between gap-3 rounded-xl bg-beige px-3 py-2 hover:bg-arena">
                            <span className="font-semibold">{p.name}</span>
                            <span className="shrink-0 text-chocolate-medio">{p.price === null ? 'Según diseño' : formatPrice(p.price)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  {m.view === 'faq-list' && (
                    <ul className="mt-2 space-y-1.5">
                      {faqData.map((f) => (
                        <li key={f.id}>
                          <button type="button" onClick={() => push({ from: 'user', text: f.question }, { from: 'bot', faq: f })}
                            className="w-full rounded-xl bg-beige px-3 py-2 text-left hover:bg-arena">
                            {f.question}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {m.view === 'lead' && (
                    <LeadForm onDone={(name, code) => push({
                      from: 'bot',
                      text: `¡Gracias, ${name}! Registramos tu consulta con el código ${code}. Te contactaremos pronto.`,
                    })} />
                  )}
                  {m.view === 'whatsapp' && (
                    <WhatsAppLink origin="chatbot" className="btn-primary btn-sm mt-2">Abrir WhatsApp</WhatsAppLink>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-arena bg-marfil p-3">
            <ul className="mb-2 flex gap-1.5 overflow-x-auto pb-1" aria-label="Opciones rápidas">
              {options.map((o) => (
                <li key={o.label} className="shrink-0">
                  <button type="button" onClick={() => choose(o)}
                    className="rounded-full border border-arena bg-crema px-3 py-1.5 text-xs font-semibold text-chocolate hover:bg-beige">
                    {o.label}
                  </button>
                </li>
              ))}
            </ul>
            <form onSubmit={ask} className="flex gap-2">
              <label htmlFor="bot-input" className="sr-only">Escribe tu pregunta</label>
              <input id="bot-input" ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} maxLength={200}
                placeholder="Escribe tu pregunta…" className="field !rounded-full !py-2 text-sm" autoComplete="off" />
              <button type="submit" aria-label="Enviar pregunta" className="btn-primary !min-h-10 !px-3.5 !py-2">
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        </section>
      )}
    </>
  )
}
