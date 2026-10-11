import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { OrderSummary } from '@/components/OrderSummary'
import { Seo } from '@/components/Seo'
import { useCart } from '@/contexts/CartContext'
import { useSettings } from '@/contexts/SettingsContext'
import { paymentMethodLabels } from '@/data/site'
import { track } from '@/lib/analytics'
import { paymentDetails, paymentMethods } from '@/services/payments'
import { createOrder } from '@/services/public'
import { deliveryFee, totals } from '@/utils/cart'
import { todayIso } from '@/utils/format'

const OTHER = '__otro__'

const schema = z
  .object({
    first_name: z.string().trim().min(2, 'Ingresa tu nombre.').max(80),
    last_name: z.string().trim().min(2, 'Ingresa tu apellido.').max(80),
    email: z.string().trim().min(1, 'Ingresa tu correo electrónico.').email('Ingresa un correo electrónico válido.'),
    phone: z.string().trim().regex(/^[0-9+\s()-]{6,20}$/, 'Ingresa un número de WhatsApp válido.'),
    delivery_type: z.enum(['delivery', 'recojo']),
    zone: z.string(),
    other_district: z.string().trim().max(80),
    address: z.string().trim().max(200),
    reference: z.string().trim().max(200),
    requested_date: z.string().min(1, 'Elige la fecha en la que necesitas tu pedido.').refine((v) => !v || v >= todayIso(), 'Elige una fecha a partir de hoy.'),
    comments: z.string().trim().max(1000),
    payment_method: z.enum(['yape', 'plin', 'transferencia'], { message: 'Selecciona un método de pago.' }),
    operation_number: z.string().trim().max(40),
    marketing_consent: z.boolean(),
    website: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.delivery_type !== 'delivery') return
    if (!v.zone) ctx.addIssue({ code: 'custom', path: ['zone'], message: 'Selecciona tu distrito.' })
    if (v.zone === OTHER && v.other_district.length < 3) {
      ctx.addIssue({ code: 'custom', path: ['other_district'], message: 'Indica tu distrito.' })
    }
    if (v.address.length < 5) ctx.addIssue({ code: 'custom', path: ['address'], message: 'Indica la dirección de entrega.' })
  })
type FormValues = z.infer<typeof schema>

export default function Checkout() {
  const { items, clear } = useCart()
  const settings = useSettings()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [done, setDone] = useState(false)

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: '', last_name: '', email: '', phone: '', delivery_type: 'delivery', zone: '', other_district: '',
      address: '', reference: '', requested_date: '', comments: '', operation_number: '', marketing_consent: false, website: '',
    },
  })

  useEffect(() => {
    if (items.length) track('begin_checkout', { items: items.length })
    // Solo al entrar a la página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!items.length && !done) return <Navigate to="/carrito" replace />

  const type = watch('delivery_type')
  const zone = watch('zone')
  const method = watch('payment_method')
  const district = zone === OTHER ? watch('other_district') : zone
  const t = totals(items, deliveryFee(type, district, settings.delivery_zones))
  const details = method ? paymentDetails(method, settings) : []

  const onSubmit = handleSubmit(async (v) => {
    setServerError('')
    try {
      const result = await createOrder({
        customer: { first_name: v.first_name, last_name: v.last_name, email: v.email, phone: v.phone, marketing_consent: v.marketing_consent },
        delivery: {
          type: v.delivery_type,
          district: v.delivery_type === 'delivery' ? (v.zone === OTHER ? v.other_district : v.zone) : '',
          address: v.address, reference: v.reference, requested_date: v.requested_date, comments: v.comments,
        },
        payment: { method: v.payment_method, operation_number: v.operation_number },
        items,
        website: v.website,
      })
      setDone(true)
      clear()
      navigate('/pedido-confirmado', { state: result, replace: true })
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'No pudimos registrar tu pedido.')
    }
  })

  const field = (name: keyof FormValues) => ({
    id: `k-${name}`,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `k-${name}-error` : undefined,
    ...register(name),
  })
  const error = (name: keyof FormValues) =>
    errors[name] && <p id={`k-${name}-error`} role="alert" className="field-error">{errors[name]?.message}</p>
  const req = <span className="text-terracota-oscuro" aria-hidden="true">*</span>

  return (
    <section className="section !pt-10">
      <Seo title="Checkout | Dulce Momento" description="Completa tus datos para registrar tu pedido." path="/checkout" noindex />
      <div className="container-site">
        <h1 className="text-4xl">Finalizar pedido</h1>
        <form onSubmit={onSubmit} noValidate className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            <fieldset className="card grid gap-4 p-6 sm:grid-cols-2">
              <legend className="float-left w-full font-display text-xl font-semibold text-chocolate sm:col-span-2">Tus datos</legend>
              <div><label htmlFor="k-first_name" className="label">Nombre {req}</label>
                <input className="field" autoComplete="given-name" {...field('first_name')} />{error('first_name')}</div>
              <div><label htmlFor="k-last_name" className="label">Apellido {req}</label>
                <input className="field" autoComplete="family-name" {...field('last_name')} />{error('last_name')}</div>
              <div><label htmlFor="k-email" className="label">Correo {req}</label>
                <input type="email" className="field" autoComplete="email" {...field('email')} />{error('email')}</div>
              <div><label htmlFor="k-phone" className="label">WhatsApp {req}</label>
                <input type="tel" inputMode="tel" className="field" autoComplete="tel" {...field('phone')} />{error('phone')}</div>
            </fieldset>

            <fieldset className="card grid gap-4 p-6 sm:grid-cols-2">
              <legend className="float-left w-full font-display text-xl font-semibold text-chocolate sm:col-span-2">Entrega</legend>
              {settings.pickup_enabled && (
                <div className="sm:col-span-2">
                  <label htmlFor="k-delivery_type" className="label">Tipo de entrega {req}</label>
                  <select className="field" {...field('delivery_type')}>
                    <option value="delivery">Delivery</option>
                    <option value="recojo">Recojo (se coordina por WhatsApp)</option>
                  </select>
                </div>
              )}
              {!settings.pickup_enabled && (
                <p className="text-sm sm:col-span-2"><strong className="text-chocolate">Tipo de entrega:</strong> Delivery</p>
              )}
              {type === 'delivery' && (
                <>
                  <div>
                    <label htmlFor="k-zone" className="label">Distrito {req}</label>
                    <select className="field" {...field('zone')}>
                      <option value="">Selecciona tu distrito</option>
                      {settings.delivery_zones.map((z) => <option key={z.name} value={z.name}>{z.name}</option>)}
                      <option value={OTHER}>Otro distrito de Lima (cobertura por confirmar)</option>
                    </select>
                    {error('zone')}
                  </div>
                  {zone === OTHER && (
                    <div><label htmlFor="k-other_district" className="label">¿Cuál distrito? {req}</label>
                      <input className="field" autoComplete="address-level2" {...field('other_district')} />{error('other_district')}</div>
                  )}
                  <div className="sm:col-span-2"><label htmlFor="k-address" className="label">Dirección {req}</label>
                    <input className="field" autoComplete="street-address" {...field('address')} />{error('address')}</div>
                  <div className="sm:col-span-2"><label htmlFor="k-reference" className="label">Referencia</label>
                    <input className="field" placeholder="Ej. frente al parque, edificio, piso" {...field('reference')} /></div>
                </>
              )}
              <div><label htmlFor="k-requested_date" className="label">Fecha solicitada {req}</label>
                <input type="date" min={todayIso()} className="field" {...field('requested_date')} />{error('requested_date')}
                <p className="mt-1 text-xs">Recuerda la anticipación indicada en cada keke (de 24 horas a 5 días).</p></div>
              <div className="sm:col-span-2"><label htmlFor="k-comments" className="label">Comentarios</label>
                <textarea rows={3} className="field" placeholder="Horario preferido, indicaciones para la entrega…" {...field('comments')} /></div>
            </fieldset>

            <fieldset className="card p-6">
              <legend className="float-left mb-4 w-full font-display text-xl font-semibold text-chocolate">Método de pago</legend>
              <div className="clear-both grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Método de pago" aria-describedby={errors.payment_method ? 'k-payment_method-error' : undefined}>
                {paymentMethods.map((m) => (
                  <label key={m} className="flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border border-arena bg-crema p-3 text-sm font-semibold text-chocolate has-[:checked]:border-terracota has-[:checked]:bg-rosa-pastel">
                    <input type="radio" value={m} className="accent-terracota" {...register('payment_method')} />
                    {paymentMethodLabels[m]}
                  </label>
                ))}
              </div>
              {error('payment_method')}
              {method && (
                <div className="mt-4 space-y-4 rounded-3xl bg-beige p-5" aria-live="polite">
                  {details.length ? (
                    <dl className="grid gap-1 text-sm">
                      {details.map(([label, value]) => (
                        <div key={label} className="flex gap-3"><dt className="w-16">{label}</dt><dd className="font-bold text-chocolate">{value}</dd></div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-sm">Te enviaremos los datos de {paymentMethodLabels[method]} por WhatsApp al confirmar tu pedido.</p>
                  )}
                  <div>
                    <label htmlFor="k-operation_number" className="label">Número de operación (opcional)</label>
                    <input className="field" inputMode="numeric" {...field('operation_number')} />
                    <p className="mt-1 text-xs">
                      Si ya pagaste, ingrésalo para que podamos verificarlo. Tu pedido se confirma cuando verificamos el pago.
                    </p>
                  </div>
                </div>
              )}
            </fieldset>

            <div className="hidden" aria-hidden="true">
              <label htmlFor="k-website">No completar</label>
              <input tabIndex={-1} autoComplete="off" {...field('website')} />
            </div>
            <label htmlFor="k-marketing_consent" className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-terracota" id="k-marketing_consent" {...register('marketing_consent')} />
              <span>Quiero recibir novedades, promociones y recomendaciones de Dulce Momento por correo electrónico.</span>
            </label>
          </div>

          <div className="space-y-4 lg:sticky lg:top-24">
            <OrderSummary
              lines={items.map((i) => ({ key: i.lineId, name: i.name, quantity: i.quantity, subtotal: i.unitPrice * i.quantity, options: i.options }))}
              subtotal={t.subtotal} deliveryFee={t.deliveryFee} total={t.total} pickup={type === 'recojo'}
            />
            {serverError && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{serverError}</p>}
            <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando…' : 'Registrar pedido'}
            </button>
            <Link to="/carrito" className="btn-ghost btn-sm w-full">Volver al carrito</Link>
          </div>
        </form>
      </div>
    </section>
  )
}
