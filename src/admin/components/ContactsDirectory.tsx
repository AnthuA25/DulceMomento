import { Download, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { inquiryTypeLabels, lifecycleLabels } from '@/data/site'
import { useAsync } from '@/hooks/useAsync'
import { listContacts } from '@/services/admin'
import type { CustomerType, InquiryType } from '@/types'
import { downloadCsv, formatDate } from '@/utils/format'
import { Badge, customerTypeTone, Status } from './ui'

const typeLabel = (t: InquiryType | null) => (t ? inquiryTypeLabels[t] : '—')

/** Directorio de contactos: buscador, filtros y exportación a CSV. */
export function ContactsDirectory() {
  const { data, loading, error } = useAsync(listContacts)
  const [query, setQuery] = useState('')
  const [customerType, setCustomerType] = useState<CustomerType | ''>('')
  const [inquiryType, setInquiryType] = useState<InquiryType | ''>('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data ?? []).filter(
      (c) =>
        (!q || `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(q)) &&
        (!customerType || c.customer_type === customerType) &&
        (!inquiryType || c.last_inquiry_type === inquiryType),
    )
  }, [data, query, customerType, inquiryType])

  const exportCsv = () =>
    downloadCsv(
      `contactos-dulce-momento-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Nombre', 'Apellido', 'Correo', 'WhatsApp', 'Tipo consulta', 'Tipo cliente', 'Customer lifecycle', 'Consultas', 'Pedidos', 'Marketing', 'Fecha'],
      rows.map((c) => [
        c.first_name, c.last_name, c.email, c.phone, typeLabel(c.last_inquiry_type), c.customer_type,
        lifecycleLabels[c.lifecycle_stage], c.inquiries_count, c.orders_count, c.marketing_consent ? 'Sí' : 'No', formatDate(c.last_activity_at),
      ]),
    )

  return (
    <section aria-labelledby="directorio-titulo" className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="directorio-titulo" className="text-xl">Directorio de contactos</h2>
        <button type="button" className="btn-ghost btn-sm" onClick={exportCsv} disabled={!rows.length}>
          <Download className="h-4 w-4" aria-hidden="true" />
          Exportar contactos → CSV
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-chocolate-suave" aria-hidden="true" />
          <label htmlFor="d-search" className="sr-only">Buscar contactos</label>
          <input id="d-search" type="search" className="field !pl-10" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar contactos por Nombre, Apellido o Correo..." />
        </div>
        <div>
          <label htmlFor="d-type" className="sr-only">Filtrar por tipo de cliente</label>
          <select id="d-type" className="field" value={customerType} onChange={(e) => setCustomerType(e.target.value as CustomerType | '')}>
            <option value="">Todos los clientes</option>
            <option value="nuevo">Nuevo</option>
            <option value="recurrente">Recurrente</option>
          </select>
        </div>
        <div>
          <label htmlFor="d-inquiry" className="sr-only">Filtrar por tipo de consulta</label>
          <select id="d-inquiry" className="field" value={inquiryType} onChange={(e) => setInquiryType(e.target.value as InquiryType | '')}>
            <option value="">Todos los tipos de consulta</option>
            {(Object.keys(inquiryTypeLabels) as InquiryType[]).map((t) => <option key={t} value={t}>{inquiryTypeLabels[t]}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <Status loading={loading} error={error}
          empty={!data?.length ? 'Aún no hay contactos. Aparecerán aquí cuando alguien envíe el formulario, use el Dulce Bot o registre un pedido.' : !rows.length && 'Ningún contacto coincide con la búsqueda.'}>
          <p className="mb-2 text-xs" aria-live="polite">{rows.length} de {data?.length} contactos</p>

          {/* Escritorio: tabla. Móvil: tarjetas. */}
          <div className="hidden overflow-x-auto md:block">
            <table className="admin-table w-full">
              <thead>
                <tr>
                  <th scope="col">Nombre</th><th scope="col">Apellido</th><th scope="col">Correo</th>
                  <th scope="col">Tipo consulta</th><th scope="col">Tipo cliente</th><th scope="col">Consultas</th>
                  <th scope="col">Fecha</th><th scope="col">Acción</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td className="font-semibold">{c.first_name}</td>
                    <td>{c.last_name || '—'}</td>
                    <td className="break-all">{c.email}</td>
                    <td>{typeLabel(c.last_inquiry_type)}</td>
                    <td><Badge tone={customerTypeTone[c.customer_type]}>{c.customer_type === 'nuevo' ? 'Nuevo' : 'Recurrente'}</Badge></td>
                    <td>{c.inquiries_count}</td>
                    <td className="whitespace-nowrap">{formatDate(c.last_activity_at)}</td>
                    <td><Link to={`/admin/contactos/${c.id}`} className="btn-ghost btn-sm whitespace-nowrap">Ver detalle</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">
            {rows.map((c) => (
              <li key={c.id} className="rounded-3xl border border-arena bg-crema p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-chocolate">{c.first_name} {c.last_name}</p>
                    <p className="break-all text-sm">{c.email}</p>
                  </div>
                  <Badge tone={customerTypeTone[c.customer_type]}>{c.customer_type === 'nuevo' ? 'Nuevo' : 'Recurrente'}</Badge>
                </div>
                <p className="mt-2 text-sm">{typeLabel(c.last_inquiry_type)} · {c.inquiries_count} consulta(s) · {formatDate(c.last_activity_at)}</p>
                <Link to={`/admin/contactos/${c.id}`} className="btn-ghost btn-sm mt-3 w-full">Ver detalle</Link>
              </li>
            ))}
          </ul>
        </Status>
      </div>
    </section>
  )
}
