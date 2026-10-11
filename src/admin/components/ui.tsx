import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import type { CampaignStatus, CustomerType, LifecycleStage, PaymentStatus } from '@/types'

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-1 text-3xl">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-chocolate-suave">{label}</p>
      <p className="mt-2 font-display text-4xl font-semibold text-chocolate">{value}</p>
      {hint && <p className="mt-1 text-xs">{hint}</p>}
    </div>
  )
}

export function Status({ loading, error, empty, children }: { loading: boolean; error: string; empty?: string | false; children: ReactNode }) {
  if (loading) return <p className="py-10 text-center" role="status">Cargando…</p>
  if (error) return <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>
  if (empty) return <p className="notice py-8 text-center">{empty}</p>
  return <>{children}</>
}

const tones = {
  neutral: 'bg-beige text-chocolate',
  rosa: 'bg-rosa-pastel text-chocolate',
  green: 'bg-green-100 text-green-900',
  amber: 'bg-amber-100 text-amber-900',
  red: 'bg-red-100 text-red-900',
  blue: 'bg-sky-100 text-sky-900',
}
export function Badge({ tone = 'neutral', children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={`badge ${tones[tone]}`}>{children}</span>
}

export const customerTypeTone: Record<CustomerType, keyof typeof tones> = { nuevo: 'blue', recurrente: 'rosa' }
export const lifecycleTone: Record<LifecycleStage, keyof typeof tones> = {
  lead: 'neutral', interesado: 'amber', cliente: 'green', cliente_recurrente: 'green', cliente_fidelizado: 'rosa',
}
export const paymentTone: Record<PaymentStatus, keyof typeof tones> = {
  pendiente: 'neutral', en_verificacion: 'amber', pagado: 'green', rechazado: 'red',
}
export const campaignTone: Record<CampaignStatus, keyof typeof tones> = {
  borrador: 'neutral', programada: 'blue', enviando: 'amber', enviada: 'green', error: 'red',
}
export const campaignStatusLabels: Record<CampaignStatus, string> = {
  borrador: 'Borrador', programada: 'Programada', enviando: 'Enviando', enviada: 'Enviada', error: 'Error',
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-chocolate/50 p-3 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className={`card flex max-h-[92dvh] w-full flex-col overflow-hidden outline-none ${wide ? 'max-w-4xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between border-b border-arena px-5 py-3">
          <h2 className="text-xl">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-beige">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}
