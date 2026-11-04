import { addDoc, collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore'
import { defaultSettings } from '@/data/site'
import { requireFirestore } from '@/lib/firebase'
import type {
  Automation, Campaign, CampaignKind, Contact, ContactRow, CrmNote, CrmStage, Inquiry, InquiryStatus,
  LifecycleStage, Order, OrderStatus, PaymentStatus,
} from '@/types'

function db() {
  return requireFirestore()
}

async function rows<T>(name: string): Promise<T[]> {
  const snapshot = await getDocs(collection(db(), name))
  return snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Record<string, unknown>) }) as T)
}

async function byContact<T>(name: string, contactId: string): Promise<T[]> {
  const snapshot = await getDocs(query(collection(db(), name), where('contact_id', '==', contactId)))
  return snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Record<string, unknown>) }) as T)
}

const refFor = (name: string, id: string) => doc(db(), name, id)
const now = () => new Date().toISOString()

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

export async function getMetrics(): Promise<DashboardMetrics> {
  const [contacts, inquiries, orders] = await Promise.all([
    rows<Contact>('contacts'), rows<Inquiry>('inquiries'), rows<Order>('orders'),
  ])
  const lifecycle: DashboardMetrics['lifecycle'] = {}
  for (const contact of contacts) lifecycle[contact.lifecycle_stage] = (lifecycle[contact.lifecycle_stage] ?? 0) + 1
  const paid = orders.filter((order) => (order.payments ?? []).some((payment) => payment.status === 'pagado'))
  const pending = orders.reduce((count, order) => count + (order.payments ?? []).filter((payment) =>
    payment.status === 'pendiente' || payment.status === 'en_verificacion').length, 0)
  return {
    total_contacts: contacts.length,
    new_contacts: contacts.filter((contact) => contact.customer_type === 'nuevo').length,
    recurrent_contacts: contacts.filter((contact) => contact.customer_type === 'recurrente').length,
    inquiries: inquiries.length,
    marketing_consent: contacts.filter((contact) => contact.marketing_consent).length,
    lifecycle,
    quote_contacts: contacts.filter((contact) => contact.crm_stage === 'cotizacion').length,
    orders: orders.length,
    paid_orders: paid.length,
    pending_payments: pending,
    paid_revenue: paid.reduce((sum, order) => sum + order.total, 0),
    buyers: new Set(paid.map((order) => order.contact_id)).size,
    conversion_rate: contacts.length ? Math.round((new Set(paid.map((order) => order.contact_id)).size / contacts.length) * 100) : null,
  }
}

export async function listContacts(): Promise<ContactRow[]> {
  const [contacts, inquiries, orders] = await Promise.all([
    rows<Contact>('contacts'), rows<Inquiry>('inquiries'), rows<Order>('orders'),
  ])
  return contacts.map((contact) => {
    const contactInquiries = inquiries.filter((inquiry) => inquiry.contact_id === contact.id)
    const contactOrders = orders.filter((order) => order.contact_id === contact.id)
    const lastInquiry = contactInquiries.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
    return {
      ...contact,
      inquiries_count: contactInquiries.length,
      orders_count: contactOrders.length,
      last_inquiry_type: lastInquiry?.inquiry_type ?? null,
      last_product_name: lastInquiry?.product_name ?? null,
      last_activity_at: [contact.updated_at, ...contactInquiries.map((item) => item.created_at),
        ...contactOrders.map((item) => item.created_at)].sort().pop() ?? contact.created_at,
    }
  }).sort((a, b) => b.last_activity_at.localeCompare(a.last_activity_at))
}

export async function getContactDetail(id: string) {
  const [contactSnapshot, inquiries, notes, orders] = await Promise.all([
    getDoc(refFor('contacts', id)), byContact<Inquiry>('inquiries', id), byContact<CrmNote>('crmNotes', id),
    byContact<Order>('orders', id),
  ])
  if (!contactSnapshot.exists()) throw new Error('No se encontró el contacto.')
  return {
    contact: { id: contactSnapshot.id, ...contactSnapshot.data() } as Contact,
    inquiries: inquiries.sort((a, b) => b.created_at.localeCompare(a.created_at)),
    notes: notes.sort((a, b) => b.created_at.localeCompare(a.created_at)),
    orders: orders.sort((a, b) => b.created_at.localeCompare(a.created_at)),
  }
}

export async function addNote(contactId: string, body: string) {
  const created_at = now()
  const result = await addDoc(collection(db(), 'crmNotes'), { contact_id: contactId, body, created_at })
  return { id: result.id, contact_id: contactId, body, created_at }
}

export async function setInquiryStatus(id: string, status: InquiryStatus) {
  await updateDoc(refFor('inquiries', id), { status })
  return { id, status }
}

export async function setLifecycle(id: string, lifecycle_stage: LifecycleStage) {
  await updateDoc(refFor('contacts', id), { lifecycle_stage, updated_at: now() })
  return { id, lifecycle_stage }
}

export async function setCrmStage(id: string, crm_stage: CrmStage) {
  await updateDoc(refFor('contacts', id), { crm_stage, updated_at: now() })
  return { id, crm_stage }
}

export async function listOrders(): Promise<Order[]> {
  const [orders, contacts] = await Promise.all([rows<Order>('orders'), rows<Contact>('contacts')])
  const byId = new Map(contacts.map((contact) => [contact.id, contact]))
  return orders.map((order) => {
    const contact = byId.get(order.contact_id)
    return {
      ...order,
      contact: contact ? { first_name: contact.first_name, last_name: contact.last_name, email: contact.email, phone: contact.phone } : undefined,
    }
  }).sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function setOrderStatus(id: string, status: OrderStatus) {
  await updateDoc(refFor('orders', id), { status })
  return { id, status }
}

export async function setPaymentStatus(paymentId: string, status: PaymentStatus) {
  const orders = await rows<Order>('orders')
  const order = orders.find((candidate) => (candidate.payments ?? []).some((payment) => payment.id === paymentId))
  if (!order) throw new Error('No se encontró el pago.')
  const payments = (order.payments ?? []).map((payment) => payment.id === paymentId
    ? { ...payment, status, verified_at: status === 'pagado' ? now() : null }
    : payment)
  await updateDoc(refFor('orders', order.id), { payments })
  if (status === 'pagado') {
    const paidOrders = orders.filter((candidate) => candidate.contact_id === order.contact_id
      && (candidate.id === order.id
        ? payments.some((payment) => payment.status === 'pagado')
        : (candidate.payments ?? []).some((payment) => payment.status === 'pagado'))).length
    const contact = await getDoc(refFor('contacts', order.contact_id))
    if (contact.exists()) {
      const current = contact.data().lifecycle_stage as LifecycleStage
      const rank: LifecycleStage[] = ['lead', 'interesado', 'cliente', 'cliente_recurrente', 'cliente_fidelizado']
      const next = paidOrders > 1 ? 'cliente_recurrente' : 'cliente'
      await updateDoc(contact.ref, {
        lifecycle_stage: rank.indexOf(current) > rank.indexOf(next) ? current : next,
        crm_stage: 'confirmado',
        updated_at: now(),
      })
    }
  }
  return payments.find((payment) => payment.id === paymentId)
}

export async function getPaymentReceiptUrl(path: string): Promise<string> {
  void path
  throw new Error('La consulta de comprobantes requiere un servidor seguro; no está disponible en Firebase Spark.')
}

export async function getAllSettings(): Promise<Record<string, unknown>> {
  const settings = await rows<{ id: string; key?: string; value: unknown }>('siteSettings')
  return {
    ...defaultSettings,
    ...Object.fromEntries(settings.map((setting) => [setting.key ?? setting.id, setting.value])),
  }
}

export async function saveSettings(values: Record<string, unknown>) {
  for (const [key, value] of Object.entries(values)) {
    await setDoc(refFor('siteSettings', key), { key, value, is_public: [
      'business_name', 'whatsapp_number', 'instagram_url', 'facebook_url', 'tiktok_url',
      'payment_yape', 'payment_plin', 'payment_transfer', 'delivery_zones', 'pickup_enabled',
      'seo_title', 'seo_description',
    ].includes(key) }, { merge: true })
  }
}

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

export const getEmailConfig = async (): Promise<EmailConfigInfo> => ({
  configured: false,
  sender_email: null,
  sender_name: 'Dulce Momento',
  test_recipients: [],
})

export const previewEmail = async (draft: Pick<CampaignDraft, 'subject' | 'html' | 'kind'>) => ({
  subject: draft.subject,
  html: draft.html,
})

export async function sendTestEmail(_draft: Pick<CampaignDraft, 'subject' | 'html' | 'kind' | 'sender_name'>, _to: string): Promise<{ ok: true }> {
  throw new Error('El envío de correo requiere un servidor seguro; no está disponible en Firebase Spark.')
}

export interface SendResult {
  status: string
  recipients: number
  excluded: number
  sent?: number
  failed?: number
}

export async function getCampaignDraft(id: string) {
  const snapshot = await getDoc(refFor('campaigns', id))
  if (!snapshot.exists()) throw new Error('No se encontró el borrador.')
  const campaign = { id: snapshot.id, ...snapshot.data() } as Campaign & { recipient_ids?: string[] }
  if (campaign.status !== 'borrador') throw new Error('Esta campaña ya no es un borrador editable.')
  return { campaign, contactIds: campaign.recipient_ids ?? [] }
}

export async function saveDraft(draft: CampaignDraft, contactIds: string[], campaignId?: string) {
  const target = campaignId ? refFor('campaigns', campaignId) : doc(collection(db(), 'campaigns'))
  const existing = campaignId ? await getDoc(target) : null
  const created_at = existing?.exists() ? existing.data().created_at : now()
  const campaign = {
    ...draft,
    status: 'borrador',
    scheduled_at: null,
    sent_at: null,
    recipients_count: contactIds.length,
    recipient_ids: contactIds,
    error: null,
    created_at,
  }
  await setDoc(target, campaign)
  return { ...campaign, id: target.id } as Campaign
}

export async function sendCampaign(
  _draft: CampaignDraft, _contactIds: string[], _scheduledAt: string | null, _campaignId?: string,
): Promise<SendResult> {
  throw new Error('El envío y la programación de campañas requieren un servidor seguro; no están disponibles en Firebase Spark.')
}

export async function listCampaigns() {
  return (await rows<Campaign>('campaigns')).sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export type CampaignMetrics = Record<string, Record<string, number>>

export async function getCampaignMetrics(): Promise<CampaignMetrics> {
  const events = await rows<{ campaign_id?: string; type: string; email: string }>('emailEvents')
  const unique = new Map<string, Set<string>>()
  for (const event of events) {
    if (!event.campaign_id) continue
    const key = `${event.campaign_id}|${event.type}`
    if (!unique.has(key)) unique.set(key, new Set())
    unique.get(key)!.add(event.email)
  }
  const result: CampaignMetrics = {}
  for (const [key, recipients] of unique) {
    const [campaignId, type] = key.split('|')
    result[campaignId] = { ...result[campaignId], [type]: recipients.size }
  }
  return result
}

export async function listAutomations(): Promise<Automation[]> {
  return (await rows<Automation>('automations')).sort((a, b) => a.key.localeCompare(b.key))
}

export async function setAutomationEnabled(id: string, enabled: boolean) {
  await updateDoc(refFor('automations', id), { enabled })
  return { id, enabled }
}

export async function getEnrollmentCounts(): Promise<Record<string, Record<string, number>>> {
  const enrollments = await rows<{ automation_id: string; status: string }>('automationEnrollments')
  const counts: Record<string, Record<string, number>> = {}
  for (const item of enrollments) {
    counts[item.automation_id] ??= {}
    counts[item.automation_id][item.status] = (counts[item.automation_id][item.status] ?? 0) + 1
  }
  return counts
}

export async function runAutomations(): Promise<{ campaigns: number; sent: number; stopped: number; completed: number; failed: number }> {
  throw new Error('Las automatizaciones programadas requieren un servidor seguro; no están disponibles en Firebase Spark.')
}
