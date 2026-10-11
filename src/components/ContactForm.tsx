import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { activeProducts, getProduct } from '@/data/catalog'
import { eventTypes, inquiryTypeLabels } from '@/data/site'
import { submitInquiry } from '@/services/public'
import type { InquiryType } from '@/types'
import { todayIso } from '@/utils/format'

const inquiryTypes = Object.keys(inquiryTypeLabels) as InquiryType[]

export const contactSchema = z.object({
  first_name: z.string().trim().min(2, 'Ingresa tu nombre.').max(80),
  last_name: z.string().trim().min(2, 'Ingresa tu apellido.').max(80),
  email: z.string().trim().min(1, 'Ingresa tu correo electrónico.').email('Ingresa un correo electrónico válido.'),
  phone: z.string().trim().regex(/^[0-9+\s()-]{6,20}$/, 'Ingresa un número de WhatsApp válido.'),
  inquiry_type: z.enum(inquiryTypes as [InquiryType, ...InquiryType[]], { message: 'Selecciona el tipo de consulta.' }),
  event_type: z.string().max(60),
  event_date: z.string().refine((v) => !v || v >= todayIso(), 'Elige una fecha a partir de hoy.'),
  quantity: z.string().max(60),
  product_id: z.string(),
  message: z.string().max(2000, 'El mensaje es demasiado largo.'),
  marketing_consent: z.boolean(),
  website: z.string(),
})
type FormValues = z.infer<typeof contactSchema>

function Field({ id, label, required, error, children }: {
  id: string; label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label} {required && <span className="text-terracota-oscuro" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && <p id={`${id}-error`} role="alert" className="field-error">{error}</p>}
    </div>
  )
}

export function ContactForm() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [serverError, setServerError] = useState('')

  const presetType = params.get('tipo') as InquiryType | null
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: '', last_name: '', email: '', phone: '',
      inquiry_type: presetType && inquiryTypes.includes(presetType) ? presetType : ('' as InquiryType),
      event_type: '', event_date: '', quantity: '',
      product_id: getProduct(params.get('producto') ?? '')?.id ?? '',
      message: '', marketing_consent: false, website: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setServerError('')
    try {
      const result = await submitInquiry({ ...values, source: 'formulario' })
      navigate('/gracias', { state: result })
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'No pudimos enviar tu consulta.')
    }
  })

  const attrs = (name: keyof FormValues) => ({
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `c-${name}-error` : undefined,
  })

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2" aria-label="Formulario de consulta">
      <Field id="c-first_name" label="Nombre" required error={errors.first_name?.message}>
        <input id="c-first_name" className="field" autoComplete="given-name" {...attrs('first_name')} {...register('first_name')} />
      </Field>
      <Field id="c-last_name" label="Apellido" required error={errors.last_name?.message}>
        <input id="c-last_name" className="field" autoComplete="family-name" {...attrs('last_name')} {...register('last_name')} />
      </Field>
      <Field id="c-phone" label="WhatsApp / teléfono" required error={errors.phone?.message}>
        <input id="c-phone" type="tel" inputMode="tel" className="field" autoComplete="tel" {...attrs('phone')} {...register('phone')} />
      </Field>
      <Field id="c-email" label="Correo electrónico" required error={errors.email?.message}>
        <input id="c-email" type="email" className="field" autoComplete="email" {...attrs('email')} {...register('email')} />
      </Field>
      <Field id="c-inquiry_type" label="Tipo de consulta" required error={errors.inquiry_type?.message}>
        <select id="c-inquiry_type" className="field" {...attrs('inquiry_type')} {...register('inquiry_type')}>
          <option value="">Selecciona una opción</option>
          {inquiryTypes.map((t) => <option key={t} value={t}>{inquiryTypeLabels[t]}</option>)}
        </select>
      </Field>
      <Field id="c-event_type" label="Tipo de evento">
        <select id="c-event_type" className="field" {...register('event_type')}>
          <option value="">Selecciona una opción</option>
          {eventTypes.map((t) => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field id="c-event_date" label="Fecha del evento" error={errors.event_date?.message}>
        <input id="c-event_date" type="date" min={todayIso()} className="field" {...attrs('event_date')} {...register('event_date')} />
      </Field>
      <Field id="c-quantity" label="Cantidad aproximada">
        <input id="c-quantity" className="field" placeholder="Ej. 1 keke" {...register('quantity')} />
      </Field>
      <div className="sm:col-span-2">
        <Field id="c-product_id" label="Producto de interés">
          <select id="c-product_id" className="field" {...register('product_id')}>
            <option value="">Selecciona un keke</option>
            {activeProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field id="c-message" label="Mensaje / detalle adicional" error={errors.message?.message}>
          <textarea
            id="c-message" rows={4} className="field"
            placeholder="Cuéntanos colores, dedicatoria, hora de entrega, distrito..."
            {...attrs('message')} {...register('message')}
          />
        </Field>
      </div>

      {/* Honeypot anti-spam: oculto para personas y lectores de pantalla. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="c-website">No completar</label>
        <input id="c-website" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      <label htmlFor="c-marketing" className="flex items-start gap-3 text-sm sm:col-span-2">
        <input id="c-marketing" type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-terracota" {...register('marketing_consent')} />
        <span>Quiero recibir novedades, promociones y recomendaciones de Dulce Momento por correo electrónico.</span>
      </label>

      <div className="sm:col-span-2">
        {serverError && <p role="alert" className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{serverError}</p>}
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando…' : 'Enviar consulta'}
        </button>
        <p className="mt-3 text-xs text-chocolate-suave">
          Usamos tus datos para responder tu consulta. Recibirás un correo de confirmación con tu código de solicitud.
        </p>
      </div>
    </form>
  )
}
