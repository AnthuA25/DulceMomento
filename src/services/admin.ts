// Acceso a datos del panel administrativo. Todas las consultas usan la sesión
// del administrador; RLS impide que cualquier otra persona las ejecute.
import { callFunction, db } from '@/lib/supabase'
import type {
  Automation, Campaign, CampaignKind, Contact, ContactRow, CrmNote, Inquiry, InquiryStatus, LifecycleStage,
  Order, OrderStatus, PaymentStatus,
} from '@/types'

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message)
  return data as T
}

export interface DashboardMetrics {
  total_contacts: number
  new_contacts: number
  recurrent_contacts: number
  inquiries: number
  marketing_consent: number
  lifecycle: Partial<Record<LifecycleStage, number>>
  quote_contacts: number
  orders: number
  paid_orders: number
  pending_payments: number
  paid_revenue: number
  buyers: number
  conversion_rate: number | null
}

export const getMetrics = async () => unwrap<DashboardMetrics>(await db().rpc('admin_dashboard_metrics'))

export const listContacts = async () =>
  unwrap<ContactRow[]>(await db().from('contact_directory').select('*').order('last_activity_at', { ascending: false }))

export async function getContactDetail(id: string) {
  const [contact, inquiries, notes, orders] = await Promise.all([
    db().from('contacts').select('*').eq('id', id).single(),
    db().from('inquiries').select('*').eq('contact_id', id).order('created_at', { ascending: false }),
    db().from('crm_notes').select('*').eq('contact_id', id).order('created_at', { ascending: false }),
    db().from('orders').select('*, payments(*)').eq('contact_id', id).order('created_at', { ascending: false }),
  ])
  return {
    contact: unwrap<Contact>(contact),
    inquiries: unwrap<Inquiry[]>(inquiries),
    notes: unwrap<CrmNote[]>(notes),
    orders: unwrap<Order[]>(orders),
  }
}

export const addNote = async (contactId: string, body: string) =>
  unwrap(await db().from('crm_notes').insert({ contact_id: contactId, body }).select().single())

export const setInquiryStatus = async (id: string, status: InquiryStatus) =>
  unwrap(await db().from('inquiries').update({ status }).eq('id', id).select().single())

export const setLifecycle = async (id: string, lifecycle_stage: LifecycleStage) =>
  unwrap(await db().from('contacts').update({ lifecycle_stage }).eq('id', id).select().single())

export const listOrders = async () =>
  unwrap<Order[]>(
    await db()
      .from('orders')
      .select('*, contact:contacts(first_name, last_name, email, phone), order_items(*), payments(*)')
      .order('created_at', { ascending: false }),
  )

export const setOrderStatus = async (id: string, status: OrderStatus) =>
  unwrap(await db().from('orders').update({ status }).eq('id', id).select().single())

export const setPaymentStatus = async (paymentId: string, status: PaymentStatus) =>
  unwrap(await db().rpc('admin_set_payment_status', { p_payment: paymentId, p_status: status }))

// ---------- Configuración ----------
export async function getAllSettings(): Promise<Record<string, unknown>> {
  const rows = unwrap<{ key: string; value: unknown }[]>(await db().from('site_settings').select('key, value'))
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

export async function saveSettings(values: Record<string, unknown>) {
  for (const [key, value] of Object.entries(values)) {
    unwrap(await db().from('site_settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key).select())
  }
}

// ---------- Email marketing ----------
export interface EmailConfigInfo {
  configured: boolean
  sender_email: string | null
  sender_name: string
  test_recipients: string[]
}

export interface CampaignDraft {
  name: string
  subject: string
  sender_name: string
  kind: CampaignKind
  html: string
  segment: string
}

export const getEmailConfig = () => callFunction<EmailConfigInfo>('admin-email', { action: 'config' })

export const previewEmail = (d: Pick<CampaignDraft, 'subject' | 'html' | 'kind'>) =>
  callFunction<{ subject: string; html: string }>('admin-email', { action: 'preview', ...d })

export const sendTestEmail = (d: Pick<CampaignDraft, 'subject' | 'html' | 'kind' | 'sender_name'>, to: string) =>
  callFunction<{ ok: true }>('admin-email', { action: 'test', ...d, to })

export interface SendResult {
  status: string
  recipients: number
  excluded: number
  sent?: number
  failed?: number
}

/** Guarda la campaña como borrador y la envía (o programa) a los contactos elegidos. */
export async function sendCampaign(draft: CampaignDraft, contactIds: string[], scheduledAt: string | null) {
  const campaign = unwrap<Campaign>(await db().from('campaigns').insert(draft).select().single())
  return callFunction<SendResult>('admin-email', {
    action: 'send',
    campaign_id: campaign.id,
    contact_ids: contactIds,
    scheduled_at: scheduledAt,
  })
}

export const saveDraft = async (draft: CampaignDraft) =>
  unwrap<Campaign>(await db().from('campaigns').insert(draft).select().single())

export const listCampaigns = async () =>
  unwrap<Campaign[]>(await db().from('campaigns').select('*').order('created_at', { ascending: false }))

export type CampaignMetrics = Record<string, Record<string, number>>

/** Eventos reales por campaña, contando destinatarios únicos por tipo de evento. */
export async function getCampaignMetrics(): Promise<CampaignMetrics> {
  const rows = unwrap<{ campaign_id: string; type: string; email: string }[]>(
    await db().from('email_events').select('campaign_id, type, email').not('campaign_id', 'is', null),
  )
  const unique = new Map<string, Set<string>>()
  for (const r of rows) {
    const key = `${r.campaign_id}|${r.type}`
    if (!unique.has(key)) unique.set(key, new Set())
    unique.get(key)!.add(r.email)
  }
  const metrics: CampaignMetrics = {}
  for (const [key, emails] of unique) {
    const [id, type] = key.split('|')
    metrics[id] = { ...metrics[id], [type]: emails.size }
  }
  return metrics
}

// ---------- Automatizaciones ----------
export const listAutomations = async () =>
  unwrap<Automation[]>(
    await db()
      .from('automations')
      .select('*, automation_steps(id, step_order, delay_days, name, subject)')
      .order('key')
      .order('step_order', { referencedTable: 'automation_steps' }),
  )

export const setAutomationEnabled = async (id: string, enabled: boolean) =>
  unwrap(await db().from('automations').update({ enabled }).eq('id', id).select().single())

export async function getEnrollmentCounts(): Promise<Record<string, Record<string, number>>> {
  const rows = unwrap<{ automation_id: string; status: string }[]>(
    await db().from('automation_enrollments').select('automation_id, status'),
  )
  const counts: Record<string, Record<string, number>> = {}
  for (const r of rows) {
    counts[r.automation_id] = counts[r.automation_id] ?? {}
    counts[r.automation_id][r.status] = (counts[r.automation_id][r.status] ?? 0) + 1
  }
  return counts
}

export const runAutomations = () =>
  callFunction<{ campaigns: number; sent: number; stopped: number; completed: number; failed: number }>('run-automations', {})
