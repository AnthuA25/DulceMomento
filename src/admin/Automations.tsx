import { useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { getEnrollmentCounts, listAutomations, runAutomations, setAutomationEnabled } from '@/services/admin'
import { AdminMeta } from './AdminLayout'
import { Badge, PageHeader, Status } from './components/ui'

const STOP_RULES: Record<string, string> = {
  lead_nurture: 'Se detiene si el contacto compra (pasa a posventa), retira su consentimiento o se da de baja.',
  posventa: 'Se envía una sola vez por pedido con pago verificado. No incluye promociones.',
  pedido_pendiente: 'Se cancela si el pago se registra o se verifica antes del recordatorio. Solo aplica a contactos identificados en el checkout.',
}

export default function Automations() {
  const { data, loading, error, reload } = useAsync(async () => {
    const [automations, counts] = await Promise.all([listAutomations(), getEnrollmentCounts()])
    return { automations, counts }
  })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const act = async (action: () => Promise<string | void>) => {
    setBusy(true)
    setMessage('')
    try {
      setMessage((await action()) ?? '')
      reload()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'No se pudo completar la acción.')
    } finally {
      setBusy(false)
    }
  }

  const runNow = () => act(async () => {
    const r = await runAutomations()
    return `Ejecución completada: ${r.sent} correo(s) enviado(s), ${r.stopped} secuencia(s) detenida(s), ${r.campaigns} campaña(s) procesada(s), ${r.failed} error(es).`
  })

  return (
    <>
      <AdminMeta title="Automatizaciones" />
      <PageHeader eyebrow="Customer lifecycle" title="Automatizaciones">
        <button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={runNow}>Ejecutar ahora</button>
      </PageHeader>
      <p className="notice mb-5">
        Las secuencias se procesan con una tarea programada del servidor (ver README). “Ejecutar ahora” procesa
        manualmente los envíos que ya vencieron. Cada regla solo envía a contactos que cumplen sus condiciones.
      </p>
      {message && <p role="status" className="notice mb-5 !bg-marfil font-semibold text-chocolate">{message}</p>}

      <Status loading={loading && !data} error={error}>
        <ul className="space-y-5">
          {data?.automations.map((a) => {
            const counts = data.counts[a.id] ?? {}
            return (
              <li key={a.id} className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-2xl">
                    <h2 className="text-xl">{a.name}</h2>
                    <p className="mt-1 text-sm">{a.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge tone={a.requires_marketing_consent ? 'rosa' : 'blue'}>
                        {a.requires_marketing_consent ? 'Requiere consentimiento de marketing' : 'Operativa: sin promociones'}
                      </Badge>
                      <Badge>Disparador: {a.trigger_label}</Badge>
                    </div>
                  </div>
                  <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-chocolate">
                    <input type="checkbox" className="h-5 w-5 accent-terracota" checked={a.enabled} disabled={busy}
                      onChange={(e) => act(() => setAutomationEnabled(a.id, e.target.checked).then(() => undefined))} />
                    {a.enabled ? 'Activa' : 'Inactiva'}
                  </label>
                </div>

                <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {a.automation_steps.map((step) => (
                    <li key={step.id} className="rounded-2xl bg-beige p-4 text-sm">
                      <p className="eyebrow">Día {step.delay_days}</p>
                      <p className="mt-1 font-display text-lg font-semibold text-chocolate">{step.name}</p>
                      <p className="mt-1 break-words">“{step.subject}”</p>
                    </li>
                  ))}
                </ol>

                <p className="mt-4 text-sm"><span className="font-semibold text-chocolate">Regla de salida:</span> {STOP_RULES[a.key]}</p>
                <p className="mt-2 text-sm">
                  Contactos en la secuencia: <strong className="text-chocolate">{counts.activa ?? 0}</strong> activos ·{' '}
                  <strong className="text-chocolate">{counts.completada ?? 0}</strong> completados ·{' '}
                  <strong className="text-chocolate">{counts.detenida ?? 0}</strong> detenidos
                </p>
              </li>
            )
          })}
        </ul>
      </Status>
    </>
  )
}
