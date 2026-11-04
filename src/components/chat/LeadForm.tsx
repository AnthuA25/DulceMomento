import { useState } from 'react'
import { activeProducts } from '@/data/catalog'
import { submitInquiry } from '@/services/public'

/**
 * Captación de leads del Dulce Bot. Usa el mismo backend que el formulario
 * (source: chatbot), así el contacto llega al mismo CRM.
 */
export function LeadForm({ onDone }: { onDone: (name: string, code: string) => void }) {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (sent) return <p className="mt-2 text-chocolate-medio">Datos enviados ✓</p>

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const get = (k: string) => String(data.get(k) ?? '').trim()
    const [first, ...rest] = get('name').split(/\s+/)
    if (first.length < 2) return setError('Ingresa tu nombre.')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(get('email'))) return setError('Ingresa un correo electrónico válido.')
    if (!/^[0-9+\s()-]{6,20}$/.test(get('phone'))) return setError('Ingresa un número de WhatsApp válido.')

    setError('')
    setBusy(true)
    try {
      const result = await submitInquiry({
        first_name: first,
        last_name: rest.join(' '),
        email: get('email'),
        phone: get('phone'),
        inquiry_type: 'pedido',
        product_id: get('product_id'),
        message: get('message'),
        marketing_consent: data.get('marketing') === 'on',
        source: 'chatbot',
        website: get('website'),
      })
      setSent(true)
      onDone(result.first_name, result.request_code)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos registrar tus datos.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-3 space-y-2" aria-label="Dejar mis datos">
      <div>
        <label htmlFor="b-name" className="label !mb-1 !text-xs">Nombre y apellido *</label>
        <input id="b-name" name="name" className="field !py-2 text-sm" autoComplete="name" required />
      </div>
      <div>
        <label htmlFor="b-email" className="label !mb-1 !text-xs">Correo *</label>
        <input id="b-email" name="email" type="email" className="field !py-2 text-sm" autoComplete="email" required />
      </div>
      <div>
        <label htmlFor="b-phone" className="label !mb-1 !text-xs">WhatsApp *</label>
        <input id="b-phone" name="phone" type="tel" className="field !py-2 text-sm" autoComplete="tel" required />
      </div>
      <div>
        <label htmlFor="b-product" className="label !mb-1 !text-xs">Producto</label>
        <select id="b-product" name="product_id" className="field !py-2 text-sm">
          <option value="">Selecciona un keke</option>
          {activeProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="b-message" className="label !mb-1 !text-xs">Consulta</label>
        <textarea id="b-message" name="message" rows={2} maxLength={1000} className="field !py-2 text-sm" />
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label htmlFor="b-marketing" className="flex items-start gap-2 text-xs text-chocolate-medio">
        <input id="b-marketing" name="marketing" type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-terracota" />
        Quiero recibir novedades, promociones y recomendaciones de Dulce Momento por correo electrónico.
      </label>
      {error && <p role="alert" className="field-error">{error}</p>}
      <button type="submit" className="btn-primary btn-sm w-full" disabled={busy}>
        {busy ? 'Enviando…' : 'Enviar mis datos'}
      </button>
    </form>
  )
}
