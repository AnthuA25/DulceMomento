import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { lifecycleLabels } from '@/data/site'
import type { CampaignKind, ContactRow } from '@/types'
import { isEligible, segments, selectSegment, type SegmentId } from '@/utils/segments'
import { Badge } from './ui'

interface Props {
  contacts: ContactRow[]
  kind: CampaignKind
  selected: Set<string>
  onChange: (ids: Set<string>, segment: string) => void
}

/** Selección de destinatarios por segmento rápido, búsqueda o de forma individual. */
export function RecipientPicker({ contacts, kind, selected, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [segment, setSegment] = useState<SegmentId | null>(null)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return contacts.filter((c) => !q || `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(q))
  }, [contacts, query])

  const eligibleCount = contacts.filter((c) => isEligible(kind, c)).length

  const applySegment = (id: SegmentId) => {
    setSegment(id)
    onChange(new Set(selectSegment(id, kind, contacts).map((c) => c.id)), id)
  }

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSegment(null)
    onChange(next, 'manual')
  }

  return (
    <div>
      <p className="notice">
        {kind === 'comercial'
          ? `Campaña comercial: solo pueden recibirla los contactos que aceptaron email marketing (${eligibleCount} de ${contacts.length}). Los demás se excluyen automáticamente, también al elegir “Todos los contactos”.`
          : `Comunicación operativa: úsala solo para avisos relacionados con una consulta o un pedido de la persona (${eligibleCount} de ${contacts.length} contactos). No debe contener promociones.`}
      </p>

      <fieldset className="mt-4">
        <legend className="label">Segmentos rápidos</legend>
        <div className="flex flex-wrap gap-2">
          {segments.map((s) => (
            <button key={s.id} type="button" aria-pressed={segment === s.id} onClick={() => applySegment(s.id)}
              className={`rounded-full border px-3.5 py-2 text-sm font-semibold ${segment === s.id ? 'border-terracota bg-terracota text-white' : 'border-arena bg-crema text-chocolate hover:bg-beige'}`}>
              {s.label} <span className="font-normal opacity-80">({selectSegment(s.id, kind, contacts).length})</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-lg font-semibold text-chocolate" aria-live="polite">SELECCIONADOS: {selected.size}</p>
        <button type="button" className="btn-ghost btn-sm" disabled={!selected.size}
          onClick={() => { setSegment(null); onChange(new Set(), 'manual') }}>
          Quitar selección
        </button>
      </div>

      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-chocolate-suave" aria-hidden="true" />
        <label htmlFor="rp-search" className="sr-only">Buscar destinatarios</label>
        <input id="rp-search" type="search" className="field !pl-10" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por Nombre, Apellido o Correo..." />
      </div>

      <ul className="mt-3 max-h-80 divide-y divide-arena overflow-y-auto rounded-2xl border border-arena bg-crema">
        {visible.map((c) => {
          const eligible = isEligible(kind, c)
          return (
            <li key={c.id}>
              <label className={`flex items-center gap-3 px-4 py-2.5 text-sm ${eligible ? 'cursor-pointer hover:bg-beige' : 'opacity-60'}`}>
                <input type="checkbox" className="h-4 w-4 shrink-0 accent-terracota" disabled={!eligible}
                  checked={selected.has(c.id)} onChange={() => toggle(c.id)} />
                <span className="min-w-0 flex-1">
                  <span className="font-semibold text-chocolate">{c.first_name} {c.last_name}</span>
                  <span className="block break-all text-xs">{c.email} · {lifecycleLabels[c.lifecycle_stage]}</span>
                </span>
                {c.marketing_consent ? <Badge tone="green">Marketing: Sí</Badge> : <Badge>Marketing: No</Badge>}
              </label>
            </li>
          )
        })}
        {!visible.length && <li className="px-4 py-6 text-center text-sm">No hay contactos que coincidan.</li>}
      </ul>
    </div>
  )
}
