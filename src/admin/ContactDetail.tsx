import { ArrowLeft, Mail, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSettings } from '@/contexts/SettingsContext'
import { inquiryStatusLabels, inquiryTypeLabels, lifecycleLabels, lifecycleOrder, orderStatusLabels, paymentStatusLabels } from '@/data/site'
import { useAsync } from '@/hooks/useAsync'
import { trackWhatsApp, waMessages, whatsappLink } from '@/lib/whatsapp'
import { addNote, getContactDetail, setInquiryStatus, setLifecycle } from '@/services/admin'
import type { InquiryStatus, LifecycleStage } from '@/types'
import { formatDate, formatDateTime, formatPrice } from '@/utils/format'
import { AdminMeta } from './AdminLayout'
import { Badge, customerTypeTone, lifecycleTone, paymentTone, Status } from './components/ui'

export default function ContactDetail() {
  const { id = '' } = useParams()
  const { data, loading, error, reload } = useAsync(() => getContactDetail(id), [id])
  const { business_name } = useSettings()
  const [note, setNote] = useState('')
  const [actionError, setActionError] = useState('')

  const run = async (action: () => Promise<unknown>) => {
    setActionError('')
    try {
      await action()
      reload()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'No se pudo guardar el cambio.')
    }
  }

  const c = data?.contact
  const lastInquiry = data?.inquiries[0]

  return (
    <>
      <AdminMeta title="Detalle del contacto" />
      <Link to="/admin/contactos" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-terracota-oscuro">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al directorio
      </Link>
      <Status loading={loading && !data} error={error}>
        {c && data && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-3xl">{c.first_name} {c.last_name}</h1>
              <div className="flex flex-wrap gap-2">
                {/* Abre WhatsApp con el mensaje preparado; el administrador decide si lo envía. */}
                {c.phone ? (
                  <a className="btn-primary btn-sm" target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsApp('crm')}
                    href={whatsappLink(c.phone.replace(/\D/g, '').length === 9 ? `51${c.phone}` : c.phone, waMessages.crm(c.first_name, lastInquiry?.product_name ?? null))}>
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Contactar por WhatsApp
                  </a>
                ) : (
                  <span className="notice !py-2">Sin WhatsApp registrado</span>
                )}
                <a className="btn-ghost btn-sm" href={`mailto:${c.email}?subject=${encodeURIComponent(`Tu consulta en ${business_name}`)}`}>
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Enviar email
                </a>
              </div>
            </div>
            {actionError && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{actionError}</p>}

            <div className="grid gap-6 lg:grid-cols-3">
              <section className="card p-5" aria-labelledby="datos-titulo">
                <h2 id="datos-titulo" className="eyebrow">Datos personales</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  {([['Nombre', c.first_name], ['Apellido', c.last_name || '—'], ['Correo', c.email], ['WhatsApp', c.phone ?? '—'], ['Origen', c.source], ['Registrado', formatDate(c.created_at)]] as const).map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[6rem_1fr] gap-2"><dt>{k}</dt><dd className="break-all font-semibold text-chocolate">{v}</dd></div>
                  ))}
                </dl>
              </section>

              <section className="card p-5" aria-labelledby="clasificacion-titulo">
                <h2 id="clasificacion-titulo" className="eyebrow">Clasificación</h2>
                <dl className="mt-3 space-y-3 text-sm">
                  <div>
                    <dt>Por consultas</dt>
                    <dd className="mt-1"><Badge tone={customerTypeTone[c.customer_type]}>{c.customer_type === 'nuevo' ? 'Nuevo' : 'Recurrente'}</Badge>
                      <span className="ml-2 text-xs">{data.inquiries.length} consulta(s)</span></dd>
                  </div>
                  <div>
                    <dt>Customer lifecycle</dt>
                    <dd className="mt-1"><Badge tone={lifecycleTone[c.lifecycle_stage]}>{lifecycleLabels[c.lifecycle_stage]}</Badge></dd>
                  </div>
                </dl>
                <label htmlFor="cd-lifecycle" className="label mt-4">Cambiar etapa</label>
                <select id="cd-lifecycle" className="field" value={c.lifecycle_stage}
                  onChange={(e) => run(() => setLifecycle(c.id, e.target.value as LifecycleStage))}>
                  {lifecycleOrder.map((s) => <option key={s} value={s}>{lifecycleLabels[s]}</option>)}
                </select>
                <p className="mt-2 text-xs">La etapa avanza sola con las consultas y los pagos verificados; aquí puedes corregirla.</p>
              </section>

              <section className="card p-5" aria-labelledby="consentimiento-titulo">
                <h2 id="consentimiento-titulo" className="eyebrow">Consentimiento</h2>
                <p className="mt-3 text-sm">Marketing por email:{' '}
                  <Badge tone={c.marketing_consent ? 'green' : 'neutral'}>{c.marketing_consent ? 'Sí' : 'No'}</Badge>
                </p>
                <p className="mt-2 text-xs">
                  {c.marketing_consent
                    ? `Aceptó el ${formatDateTime(c.marketing_consent_at)}. Puede recibir campañas comerciales.`
                    : 'Solo puede recibir correos sobre sus propias consultas y pedidos. No entra en campañas comerciales.'}
                </p>
              </section>
            </div>

            <section className="card p-5" aria-labelledby="historial-titulo">
              <h2 id="historial-titulo" className="text-xl">Historial de consultas</h2>
              <Status loading={false} error="" empty={!data.inquiries.length && 'Este contacto no tiene consultas (llegó por un pedido).'}>
                <div className="mt-3 overflow-x-auto">
                  <table className="admin-table w-full min-w-[44rem]">
                    <thead><tr><th scope="col">Fecha</th><th scope="col">Código</th><th scope="col">Tipo</th><th scope="col">Producto</th><th scope="col">Mensaje</th><th scope="col">Estado</th></tr></thead>
                    <tbody>
                      {data.inquiries.map((q) => (
                        <tr key={q.id}>
                          <td className="whitespace-nowrap">{formatDateTime(q.created_at)}</td>
                          <td className="whitespace-nowrap font-semibold">{q.request_code}</td>
                          <td>{inquiryTypeLabels[q.inquiry_type]}<span className="block text-xs text-chocolate-suave">vía {q.source}</span></td>
                          <td>{q.product_name ?? '—'}</td>
                          <td className="max-w-xs whitespace-pre-line break-words">
                            {q.message ?? '—'}
                            {(q.event_type || q.event_date || q.quantity) && (
                              <span className="mt-1 block text-xs text-chocolate-suave">
                                {[q.event_type, q.event_date && formatDate(q.event_date), q.quantity].filter(Boolean).join(' · ')}
                              </span>
                            )}
                          </td>
                          <td>
                            <label htmlFor={`st-${q.id}`} className="sr-only">Estado de {q.request_code}</label>
                            <select id={`st-${q.id}`} className="field !w-auto !py-1.5 text-sm" value={q.status}
                              onChange={(e) => run(() => setInquiryStatus(q.id, e.target.value as InquiryStatus))}>
                              {(Object.keys(inquiryStatusLabels) as InquiryStatus[]).map((s) => <option key={s} value={s}>{inquiryStatusLabels[s]}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Status>
            </section>

            {data.orders.length > 0 && (
              <section className="card p-5" aria-labelledby="pedidos-titulo">
                <h2 id="pedidos-titulo" className="text-xl">Pedidos</h2>
                <ul className="mt-3 divide-y divide-arena text-sm">
                  {data.orders.map((o) => (
                    <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <span className="font-semibold text-chocolate">{o.order_code}</span>
                      <span>{formatDate(o.created_at)}</span>
                      <span>{orderStatusLabels[o.status]}</span>
                      {o.payments?.[0] && <Badge tone={paymentTone[o.payments[0].status]}>{paymentStatusLabels[o.payments[0].status]}</Badge>}
                      <span className="font-bold text-chocolate">{formatPrice(Number(o.total))}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/admin/pedidos" className="mt-2 inline-block text-sm font-semibold text-terracota-oscuro underline">Gestionar pedidos</Link>
              </section>
            )}

            <section className="card p-5" aria-labelledby="notas-titulo">
              <h2 id="notas-titulo" className="text-xl">Notas CRM</h2>
              <form className="mt-3" onSubmit={(e) => {
                e.preventDefault()
                if (note.trim()) run(() => addNote(c.id, note.trim()).then(() => setNote('')))
              }}>
                <label htmlFor="cd-note" className="label">Agregar nota</label>
                <textarea id="cd-note" rows={3} maxLength={2000} className="field" value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="Ej. Prefiere que la contacten por la tarde." />
                <button type="submit" className="btn-primary btn-sm mt-3" disabled={!note.trim()}>Guardar nota</button>
              </form>
              <ul className="mt-5 space-y-3">
                {data.notes.map((n) => (
                  <li key={n.id} className="rounded-2xl bg-beige p-4 text-sm">
                    <p className="whitespace-pre-line break-words text-chocolate">{n.body}</p>
                    <p className="mt-1 text-xs">{formatDateTime(n.created_at)}</p>
                  </li>
                ))}
                {!data.notes.length && <li className="text-sm">Sin notas todavía.</li>}
              </ul>
            </section>
          </div>
        )}
      </Status>
    </>
  )
}
