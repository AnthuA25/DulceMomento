import type { CampaignKind, ContactRow } from '../types/index.ts'

export type SegmentId =
  | 'consentimiento'
  | 'nuevos'
  | 'recurrentes'
  | 'leads'
  | 'interesados'
  | 'clientes'
  | 'clientes_recurrentes'
  | 'todos'

export const segments: { id: SegmentId; label: string; match: (c: ContactRow) => boolean }[] = [
  { id: 'consentimiento', label: 'Consentimiento = Sí', match: (c) => c.marketing_consent },
  { id: 'nuevos', label: 'Clientes nuevos', match: (c) => c.customer_type === 'nuevo' },
  { id: 'recurrentes', label: 'Clientes recurrentes', match: (c) => c.customer_type === 'recurrente' },
  { id: 'leads', label: 'Leads', match: (c) => c.lifecycle_stage === 'lead' },
  { id: 'interesados', label: 'Interesados', match: (c) => c.lifecycle_stage === 'interesado' },
  { id: 'clientes', label: 'Clientes', match: (c) => c.lifecycle_stage === 'cliente' },
  {
    id: 'clientes_recurrentes',
    label: 'Clientes recurrentes (lifecycle)',
    match: (c) => c.lifecycle_stage === 'cliente_recurrente' || c.lifecycle_stage === 'cliente_fidelizado',
  },
  { id: 'todos', label: 'Todos los contactos', match: () => true },
]

/**
 * ¿Puede este contacto recibir una campaña de este tipo?
 * El backend vuelve a aplicar la misma regla antes de enviar.
 */
export function isEligible(kind: CampaignKind, c: ContactRow): boolean {
  return kind === 'comercial' ? c.marketing_consent : c.inquiries_count + c.orders_count > 0
}

/** Contactos de un segmento que además pueden recibir la campaña. */
export function selectSegment(id: SegmentId, kind: CampaignKind, contacts: ContactRow[]): ContactRow[] {
  const segment = segments.find((s) => s.id === id)
  return segment ? contacts.filter((c) => segment.match(c) && isEligible(kind, c)) : []
}
