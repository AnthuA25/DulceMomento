import { lifecycleLabels, lifecycleOrder } from '@/data/site'
import { useAsync } from '@/hooks/useAsync'
import { getMetrics, type DashboardMetrics } from '@/services/admin'
import { formatPrice } from '@/utils/format'
import { AdminMeta } from './AdminLayout'
import { ContactsDirectory } from './components/ContactsDirectory'
import { PageHeader, StatCard, Status } from './components/ui'

/**
 * Funnel calculado con datos reales. "Visitante" no se mide porque no hay
 * analítica web conectada; las etapas del lifecycle son acumulativas
 * (un cliente también pasó por lead e interesado).
 */
function Funnel({ m }: { m: DashboardMetrics }) {
  const reached = (index: number) => lifecycleOrder.slice(index).reduce((sum, stage) => sum + (m.lifecycle[stage] ?? 0), 0)
  const stages: { label: string; value: number | null; note?: string }[] = [
    { label: 'Visitante', value: null, note: 'No disponible: sin analítica web conectada' },
    { label: 'Lead', value: reached(0) },
    { label: 'Interesado', value: reached(1) },
    { label: 'Cotización', value: m.quote_contacts, note: 'Contactos que pidieron cotización o pedido' },
    { label: lifecycleLabels.cliente, value: reached(2) },
    { label: lifecycleLabels.cliente_recurrente, value: reached(3) },
    { label: 'Fidelizado', value: reached(4) },
  ]
  const max = Math.max(1, ...stages.map((s) => s.value ?? 0))

  return (
    <section aria-labelledby="funnel-titulo" className="card p-5">
      <h2 id="funnel-titulo" className="text-xl">Funnel de conversión</h2>
      <ol className="mt-4 space-y-2">
        {stages.map((stage) => (
          <li key={stage.label} className="grid grid-cols-[8.5rem_1fr_auto] items-center gap-3 text-sm">
            <span className="font-semibold text-chocolate">{stage.label}</span>
            <span className="h-6 overflow-hidden rounded-full bg-beige" aria-hidden="true">
              {stage.value !== null && (
                <span className="block h-full rounded-full bg-gradient-to-r from-terracota to-terracota-claro"
                  style={{ width: `${(stage.value / max) * 100}%`, minWidth: stage.value ? '0.5rem' : 0 }} />
              )}
            </span>
            <span className="w-10 text-right font-bold text-chocolate">{stage.value ?? '—'}</span>
            {stage.note && <span className="col-span-3 -mt-1 pl-[9.25rem] text-xs">{stage.note}</span>}
          </li>
        ))}
      </ol>
    </section>
  )
}

export default function Dashboard() {
  const { data: m, loading, error } = useAsync(getMetrics)

  return (
    <>
      <AdminMeta title="Inicio" />
      <PageHeader eyebrow="Base de contactos & historial CRM" title="Panel administrativo — Dulce Momento" />
      <Status loading={loading} error={error}>
        {m && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total de contactos" value={m.total_contacts} />
              <StatCard label="Clientes nuevos" value={m.new_contacts} hint="Con 1 consulta" />
              <StatCard label="Clientes recurrentes" value={m.recurrent_contacts} hint="Con 2 o más consultas" />
              <StatCard label="Consultas recibidas" value={m.inquiries} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Pedidos" value={m.orders} hint={`${m.paid_orders} con pago verificado`} />
              <StatCard label="Pagos por revisar" value={m.pending_payments} hint="Pendientes o en verificación" />
              <StatCard label="Ventas verificadas" value={formatPrice(Number(m.paid_revenue))} />
              <StatCard label="Tasa de conversión"
                value={m.conversion_rate === null ? 'No disponible' : `${m.conversion_rate}%`}
                hint={m.conversion_rate === null ? 'Aún no hay contactos' : `${m.buyers} de ${m.total_contacts} contactos compraron`} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Funnel m={m} />
              <section aria-labelledby="lifecycle-titulo" className="card p-5">
                <h2 id="lifecycle-titulo" className="text-xl">Customer lifecycle</h2>
                <p className="mt-1 text-xs">Etapa actual de cada contacto. Es independiente de Nuevo/Recurrente por consultas.</p>
                <dl className="mt-4 divide-y divide-arena text-sm">
                  {lifecycleOrder.map((stage) => (
                    <div key={stage} className="flex justify-between py-2.5">
                      <dt>{lifecycleLabels[stage]}</dt>
                      <dd className="font-bold text-chocolate">{m.lifecycle[stage] ?? 0}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between py-2.5">
                    <dt>Aceptaron email marketing</dt>
                    <dd className="font-bold text-chocolate">{m.marketing_consent}</dd>
                  </div>
                </dl>
              </section>
            </div>
          </div>
        )}
      </Status>
      <div className="mt-6"><ContactsDirectory /></div>
    </>
  )
}
