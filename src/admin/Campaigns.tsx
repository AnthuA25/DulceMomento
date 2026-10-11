import { Link } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import { getCampaignMetrics, listCampaigns } from '@/services/admin'
import { formatDateTime } from '@/utils/format'
import { segments } from '@/utils/segments'
import { AdminMeta } from './AdminLayout'
import { Badge, campaignStatusLabels, campaignTone, PageHeader, Status } from './components/ui'

const METRICS = [
  ['sent', 'Enviados'], ['delivered', 'Entregados'], ['opened', 'Aperturas'],
  ['clicked', 'Clics'], ['bounced', 'Rebotes'], ['unsubscribed', 'Bajas'],
] as const
// Estos datos solo existen si el proveedor de email los reporta por webhook.
const FROM_PROVIDER = new Set(['delivered', 'opened', 'clicked', 'bounced'])

export default function Campaigns() {
  const { data, loading, error } = useAsync(async () => {
    const [campaigns, metrics] = await Promise.all([listCampaigns(), getCampaignMetrics()])
    return { campaigns, metrics }
  })

  return (
    <>
      <AdminMeta title="Campañas" />
      <PageHeader eyebrow="Email marketing" title="Historial de campañas">
        <Link to="/admin/email-marketing" className="btn-primary btn-sm">Crear campaña</Link>
      </PageHeader>
      <Status loading={loading} error={error} empty={!data?.campaigns.length && 'Aún no hay campañas. Crea la primera desde Email marketing.'}>
        <p className="notice mb-4">
          Las métricas muestran eventos reales registrados por el proveedor de email. “No disponible” significa que el
          proveedor todavía no reportó ese dato para la campaña (requiere el webhook y, para aperturas y clics, activar el
          seguimiento en el proveedor). Bajas: registradas desde el enlace de baja, sin atribución por campaña.
        </p>
        <ul className="space-y-4">
          {data?.campaigns.map((c) => {
            const m = data.metrics[c.id] ?? {}
            const hasProviderData = [...FROM_PROVIDER].some((t) => m[t] !== undefined)
            return (
              <li key={c.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-xl">{c.name}</h2>
                    <p className="break-words text-sm"><span className="font-semibold text-chocolate">Asunto:</span> {c.subject}</p>
                  </div>
                  <Badge tone={campaignTone[c.status]}>{campaignStatusLabels[c.status].toUpperCase()}</Badge>
                </div>
                <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div><dt className="inline">Fecha: </dt><dd className="inline font-semibold text-chocolate">{formatDateTime(c.sent_at ?? c.scheduled_at ?? c.created_at)}</dd></div>
                  <div><dt className="inline">Tipo: </dt><dd className="inline font-semibold text-chocolate">{c.kind === 'comercial' ? 'Comercial' : 'Operativa'}</dd></div>
                  <div><dt className="inline">Segmento: </dt><dd className="inline font-semibold text-chocolate">{segments.find((s) => s.id === c.segment)?.label ?? 'Selección manual'}</dd></div>
                  <div><dt className="inline">Destinatarios: </dt><dd className="inline font-semibold text-chocolate">{c.recipients_count}</dd></div>
                </dl>
                {c.error && <p className="mt-2 text-sm font-medium text-red-800">{c.error}</p>}
                {c.status !== 'borrador' && c.status !== 'programada' && (
                  <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    {METRICS.map(([type, label]) => {
                      const available = type === 'sent' || (FROM_PROVIDER.has(type) && hasProviderData)
                      return (
                        <div key={type} className="rounded-2xl bg-beige p-3 text-center">
                          <dt className="text-[11px] font-bold uppercase tracking-wider text-chocolate-suave">{label}</dt>
                          <dd className={available ? 'font-display text-2xl font-semibold text-chocolate' : 'mt-1 text-xs'}>
                            {available ? m[type] ?? 0 : 'No disponible'}
                          </dd>
                        </div>
                      )
                    })}
                  </dl>
                )}
              </li>
            )
          })}
        </ul>
      </Status>
    </>
  )
}
