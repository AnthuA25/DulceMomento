import { defaultSettings } from '@/data/site'
import type { Campaign, Contact, ContactRow, Inquiry, Order, Payment } from '@/types'

const STORAGE_KEY = 'dulce-momento-offline:v1'
const DEFAULT_ADMIN_USER = (import.meta.env.VITE_ADMIN_USER as string | undefined)?.trim() || 'admin'
const DEFAULT_ADMIN_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined)?.trim() || '2026USMP'

export const localDemoCredentials = {
  user: DEFAULT_ADMIN_USER,
  password: DEFAULT_ADMIN_PASSWORD,
}

function uid(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}-${crypto.randomUUID()}`
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}

function nowIso() {
  return new Date().toISOString()
}

function mergeSeededRecords<T>(seed: T[], current: T[], key: keyof T): T[] {
  const map = new Map<string, T>()
  for (const row of [...seed, ...current]) {
    const value = row[key]
    const id = typeof value === 'string' ? value : value !== null && value !== undefined ? String(value) : ''
    if (!id) continue
    map.set(id, { ...(map.get(id) ?? {}), ...row })
  }
  return Array.from(map.values())
}

function readStore(): Record<string, unknown[]> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createSeedData()
    const parsed = JSON.parse(raw) as Record<string, unknown[]>
    const seeded = createSeedData()
    const contacts = mergeSeededRecords<Contact>(seeded.contacts as Contact[], (parsed.contacts ?? []) as Contact[], 'email')
    return {
      ...seeded,
      ...parsed,
      contacts,
      inquiries: mergeSeededRecords<Inquiry>(seeded.inquiries as Inquiry[], (parsed.inquiries ?? []) as Inquiry[], 'id'),
      site_settings: Array.isArray(parsed.site_settings) && parsed.site_settings.length ? parsed.site_settings : seeded.site_settings,
    }
  } catch {
    return createSeedData()
  }
}

function writeStore(store: Record<string, unknown[]>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function ensureSeedData(): Record<string, unknown[]> {
  const store = readStore()
  const seeded = createSeedData()
  const normalized = { ...seeded, ...store }
  normalized.contacts = mergeSeededRecords<Contact>(seeded.contacts as Contact[], (normalized.contacts ?? []) as Contact[], 'email')
  normalized.inquiries = mergeSeededRecords<Inquiry>(seeded.inquiries as Inquiry[], (normalized.inquiries ?? []) as Inquiry[], 'id')
  normalized.site_settings = Array.isArray(normalized.site_settings) && normalized.site_settings.length ? normalized.site_settings : seeded.site_settings
  writeStore(normalized)
  return normalized
}

function createSeedData(): Record<string, unknown[]> {
  const now = nowIso()
  const demoContacts: Contact[] = [
    {
      id: 'contact-demo-01',
      first_name: 'Rosa',
      last_name: 'Vásquez',
      email: 'rosav@gmail.com',
      phone: '987678767',
      customer_type: 'nuevo',
      lifecycle_stage: 'lead',
      marketing_consent: true,
      marketing_consent_at: now,
      source: 'formulario',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'contact-demo-02',
      first_name: 'Mateo',
      last_name: 'Pérez',
      email: 'mateo.perez@gmail.com',
      phone: '978112233',
      customer_type: 'recurrente',
      lifecycle_stage: 'cliente',
      marketing_consent: true,
      marketing_consent_at: now,
      source: 'checkout',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'contact-demo-03',
      first_name: 'Lucía',
      last_name: 'Torres',
      email: 'lucia.torres@gmail.com',
      phone: '932445566',
      customer_type: 'nuevo',
      lifecycle_stage: 'interesado',
      marketing_consent: false,
      marketing_consent_at: null,
      source: 'chatbot',
      created_at: now,
      updated_at: now,
    },
  ]

  const demoInquiries: Inquiry[] = [
    {
      id: 'inquiry-demo-01',
      contact_id: 'contact-demo-01',
      request_code: 'DM-148846',
      inquiry_type: 'pedido',
      product_name: 'Keke clásico de chocolate',
      event_type: 'Cumpleaños',
      event_date: now,
      quantity: '1 keke',
      message: 'Quiero un keke para una reunión familiar.',
      source: 'formulario',
      status: 'nueva',
      created_at: now,
    },
    {
      id: 'inquiry-demo-02',
      contact_id: 'contact-demo-02',
      request_code: 'DM-221899',
      inquiry_type: 'cotizacion',
      product_name: 'Keke personalizado de vainilla y rosas',
      event_type: 'Aniversario',
      event_date: now,
      quantity: '1 keke',
      message: 'Necesito cotización para un aniversario.',
      source: 'checkout',
      status: 'respondida',
      created_at: now,
    },
    {
      id: 'inquiry-demo-03',
      contact_id: 'contact-demo-02',
      request_code: 'DM-322110',
      inquiry_type: 'pedido',
      product_name: 'Keke de chocolate',
      event_type: 'Oficina',
      event_date: now,
      quantity: '20 porciones',
      message: 'Pedido para la oficina.',
      source: 'checkout',
      status: 'cerrada',
      created_at: now,
    },
    {
      id: 'inquiry-demo-04',
      contact_id: 'contact-demo-03',
      request_code: 'DM-411224',
      inquiry_type: 'delivery',
      product_name: null,
      event_type: 'Momento especial',
      event_date: now,
      quantity: '1 keke',
      message: 'Consulta sobre delivery para San Isidro.',
      source: 'chatbot',
      status: 'en_proceso',
      created_at: now,
    },
  ]

  const settings = [
    { key: 'business_name', value: defaultSettings.business_name, is_public: true },
    { key: 'whatsapp_number', value: defaultSettings.whatsapp_number, is_public: true },
    { key: 'instagram_url', value: defaultSettings.instagram_url, is_public: true },
    { key: 'facebook_url', value: defaultSettings.facebook_url, is_public: true },
    { key: 'tiktok_url', value: defaultSettings.tiktok_url, is_public: true },
    { key: 'payment_yape', value: defaultSettings.payment_yape, is_public: true },
    { key: 'payment_plin', value: defaultSettings.payment_plin, is_public: true },
    { key: 'payment_transfer', value: defaultSettings.payment_transfer, is_public: true },
    { key: 'delivery_zones', value: defaultSettings.delivery_zones, is_public: true },
    { key: 'pickup_enabled', value: defaultSettings.pickup_enabled, is_public: true },
    { key: 'seo_title', value: defaultSettings.seo_title, is_public: true },
    { key: 'seo_description', value: defaultSettings.seo_description, is_public: true },
    { key: 'sender_name', value: 'Dulce Momento', is_public: false },
    { key: 'sender_email', value: 'hello@dulcemomento.pe', is_public: false },
    { key: 'admin_email', value: 'admin@dulcemomento.pe', is_public: false },
    { key: 'loyalty_min_orders', value: 4, is_public: false },
  ]
  const automations = [
    { id: uid('automation'), key: 'welcome', name: 'Bienvenida', enabled: true, requires_marketing_consent: true, description: 'Correo de bienvenida', trigger_label: 'Lead con consentimiento', automation_steps: [] },
    { id: uid('automation'), key: 'help', name: 'Ayuda', enabled: true, requires_marketing_consent: true, description: 'Seguimiento', trigger_label: 'Leads activos', automation_steps: [] },
  ]

  return {
    contacts: demoContacts,
    inquiries: demoInquiries,
    crm_notes: [] as { id: string; contact_id: string; body: string; created_at: string }[],
    orders: [] as Order[],
    payments: [] as Payment[],
    campaigns: [] as Campaign[],
    email_events: [] as { id: string; campaign_id: string | null; type: string; email: string }[],
    automations,
    automation_enrollments: [] as { automation_id: string; status: string }[],
    site_settings: settings,
    admin_profiles: [{ user_id: 'local-admin', email: `${DEFAULT_ADMIN_USER}@local.demo` }],
  }
}

const normalizeContact = (contact: Contact) => ({
  ...contact,
  customer_type: contact.customer_type ?? 'nuevo',
  lifecycle_stage: contact.lifecycle_stage ?? 'lead',
  marketing_consent: Boolean(contact.marketing_consent),
  marketing_consent_at: contact.marketing_consent_at ?? null,
  source: contact.source ?? 'formulario',
  created_at: contact.created_at || nowIso(),
  updated_at: contact.updated_at || nowIso(),
})

function getContactRows(): ContactRow[] {
  const store = ensureSeedData()
  const contacts = (store.contacts ?? []) as Contact[]
  const inquiries = (store.inquiries ?? []) as Inquiry[]
  const orders = (store.orders ?? []) as Order[]
  return contacts.map((contact) => {
    const contactInquiries = inquiries.filter((row) => row.contact_id === contact.id)
    const contactOrders = orders.filter((row) => row.contact_id === contact.id)
    return {
      ...normalizeContact(contact),
      inquiries_count: contactInquiries.length,
      orders_count: contactOrders.length,
      last_inquiry_type: contactInquiries[0]?.inquiry_type ?? null,
      last_product_name: contactInquiries[0]?.product_name ?? null,
      last_activity_at: contactInquiries[0]?.created_at ?? contact.created_at,
    }
  })
}

function computeMetrics() {
  const contactRows = getContactRows()
  const inquiries = (ensureSeedData().inquiries ?? []) as Inquiry[]
  const orders = (ensureSeedData().orders ?? []) as Order[]
  const payments = (ensureSeedData().payments ?? []) as Payment[]
  const total_contacts = contactRows.length
  const new_contacts = contactRows.filter((c) => c.inquiries_count === 1).length
  const recurrent_contacts = contactRows.filter((c) => c.inquiries_count >= 2).length
  const lifecycle = {
    lead: contactRows.filter((c) => c.lifecycle_stage === 'lead').length,
    interesado: contactRows.filter((c) => c.lifecycle_stage === 'interesado').length,
    cliente: contactRows.filter((c) => c.lifecycle_stage === 'cliente').length,
    cliente_recurrente: contactRows.filter((c) => c.lifecycle_stage === 'cliente_recurrente').length,
    cliente_fidelizado: contactRows.filter((c) => c.lifecycle_stage === 'cliente_fidelizado').length,
  }
  const quote_contacts = contactRows.filter((c) => c.last_inquiry_type && ['cotizacion', 'pedido', 'keke_personalizado'].includes(c.last_inquiry_type)).length
  const buyers = contactRows.filter((c) => orders.some((o) => o.contact_id === c.id && (o.status === 'entregado' || o.status === 'confirmado' || o.status === 'en_preparacion'))).length
  const paid_orders = orders.filter((o) => o.status === 'entregado' || o.status === 'confirmado').length
  const pending_payments = payments.filter((p) => p.status === 'pendiente' || p.status === 'en_verificacion').length
  const paid_revenue = payments.filter((p) => p.status === 'pagado').reduce((sum, p) => sum + Number(p.amount), 0)

  return {
    total_contacts,
    new_contacts,
    recurrent_contacts,
    inquiries: inquiries.length,
    marketing_consent: contactRows.filter((c) => c.marketing_consent).length,
    lifecycle,
    quote_contacts,
    orders: orders.length,
    paid_orders,
    pending_payments,
    paid_revenue,
    buyers,
    conversion_rate: total_contacts ? Math.round((buyers / total_contacts) * 100) : null,
  }
}

function buildSelectResult(table: string, rows: unknown[], select: string) {
  const normalizedSelect = select.trim()
  const hasWildcard = normalizedSelect === '*' || normalizedSelect.includes('*')
  const low = normalizedSelect.toLowerCase()
  const needsPayments = low.includes('payments(*)')
  const needsContact = low.includes('contact:contacts')
  const needsKeyValue = low.includes('key, value') || low.includes('key,value')

  const data = rows.map((row) => {
    const base = { ...(row as Record<string, unknown>) }
    if (needsPayments && table === 'orders') {
      const payments = (ensureSeedData().payments ?? []) as Payment[]
      return { ...base, payments: payments.filter((p) => p.order_id === (base as { id?: string }).id) }
    }
    if (needsContact && table === 'orders') {
      const contacts = (ensureSeedData().contacts ?? []) as Contact[]
      const contact = contacts.find((c) => c.id === (base as { contact_id?: string }).contact_id)
      return { ...base, contact: contact ? { ...contact } : null }
    }
    if (needsKeyValue && table === 'site_settings') {
      return { key: (base as { key?: string }).key, value: (base as { value?: unknown }).value }
    }
    return base
  })

  if (!hasWildcard && !needsPayments && !needsContact && !needsKeyValue && normalizedSelect !== '*') {
    return data.map((item) => {
      const out: Record<string, unknown> = {}
      for (const field of normalizedSelect.split(',').map((x) => x.trim())) {
        const key = field.replace(/\s*\([^)]*\)/g, '').trim()
        if (key && key in (item as Record<string, unknown>)) out[key] = (item as Record<string, unknown>)[key]
      }
      return out
    })
  }

  return data
}

export class OfflineQueryBuilder {
  private table: string
  private filters: Array<{ field: string; op: 'eq' | 'not'; value: unknown }> = []
  private orderBy: { field: string; ascending: boolean } | null = null
  private selectFields: string | null = null
  private data: unknown[] = []

  constructor(table: string) {
    this.table = table
    this.data = this.loadTable(table)
  }

  private loadTable(table: string) {
    const store = ensureSeedData()
    if (table === 'contact_directory') return getContactRows()
    if (table === 'admin_dashboard_metrics') return []
    return (store[table] ?? []) as unknown[]
  }

  select(fields?: string) {
    this.selectFields = fields ?? '*'
    return this
  }

  eq(field: string, value: unknown) {
    this.filters.push({ field, op: 'eq', value })
    return this
  }

  not(field: string, _op: string, value: unknown) {
    this.filters.push({ field, op: 'not', value })
    return this
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderBy = { field, ascending: options?.ascending ?? true }
    return this
  }

  maybeSingle() {
    return Promise.resolve({ data: this.execute()[0] ?? null, error: null })
  }

  single() {
    const rows = this.execute()
    if (rows.length === 0) return Promise.resolve({ data: null, error: { message: 'No rows found' } })
    return Promise.resolve({ data: rows[0], error: null })
  }

  insert(row: Record<string, unknown>) {
    const store = ensureSeedData()
    const tableRows = (store[this.table] ?? []) as Record<string, unknown>[]
    const next = { ...row, id: (row.id as string) ?? uid(this.table.replace(/s$/, '')) }
    tableRows.push(next)
    store[this.table] = tableRows
    writeStore(store)
    this.data = tableRows
    return this
  }

  update(row: Record<string, unknown>) {
    const store = ensureSeedData()
    const tableRows = (store[this.table] ?? []) as Record<string, unknown>[]
    const matches = this.applyFilters(tableRows)
    for (const target of matches) {
      Object.assign(target as Record<string, unknown>, row, { updated_at: nowIso() })
    }
    store[this.table] = tableRows
    writeStore(store)
    this.data = tableRows
    return this
  }

  private applyFilters(rows: unknown[]) {
    return rows.filter((row) => {
      const record = row as Record<string, unknown>
      return this.filters.every((filter) => {
        const actual = record[filter.field]
        if (filter.op === 'eq') return actual === filter.value
        if (filter.op === 'not') {
          if (filter.value === null) return actual !== null
          return actual !== filter.value
        }
        return true
      })
    })
  }

  private execute() {
    let rows = this.applyFilters(this.data)

    if (this.orderBy) {
      rows = [...rows].sort((a, b) => {
        const aa = (a as Record<string, unknown>)[this.orderBy!.field]
        const bb = (b as Record<string, unknown>)[this.orderBy!.field]
        if (aa === bb) return 0
        const result = String(aa ?? '').localeCompare(String(bb ?? ''))
        return this.orderBy!.ascending ? result : -result
      })
    }

    const select = this.selectFields ?? '*'
    const resolved = buildSelectResult(this.table, rows, select)
    return resolved as Record<string, unknown>[]
  }

  then<TResult1 = Record<string, unknown>[], TResult2 = never>(
    onfulfilled?: ((value: Record<string, unknown>[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected)
  }
}

export function createOfflineSupabaseClient() {
  const sessionStore = {
    current: null as { user: { id: string; email: string } } | null,
  }
  let authListener: ((event: string, session: { user: { id: string; email: string } } | null) => void) | null = null

  const auth = {
    async getSession() {
      return { data: { session: sessionStore.current ? { user: sessionStore.current.user } : null } }
    },
    onAuthStateChange(callback: (event: string, session: { user: { id: string; email: string } } | null) => void) {
      authListener = callback
      return { data: { subscription: { unsubscribe() { authListener = null } } }, error: null }
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const normalizedEmail = String(email || '').trim().toLowerCase()
      const allowed = [
        `${DEFAULT_ADMIN_USER.toLowerCase()}@local.demo`,
        DEFAULT_ADMIN_USER.toLowerCase(),
        `${DEFAULT_ADMIN_USER.toLowerCase()}@${(import.meta.env.VITE_ADMIN_EMAIL_DOMAIN as string | undefined)?.trim() || 'local.demo'}`,
      ]
      if (password === DEFAULT_ADMIN_PASSWORD && allowed.includes(normalizedEmail)) {
        sessionStore.current = { user: { id: 'local-admin', email: normalizedEmail } }
        authListener?.('SIGNED_IN', sessionStore.current)
        return { data: { user: sessionStore.current.user }, error: null }
      }
      return { data: { user: null }, error: { message: 'Usuario o contraseña incorrectos.' } }
    },
    async signOut() {
      sessionStore.current = null
      authListener?.('SIGNED_OUT', null)
      return { error: null }
    },
    async updateUser({ password }: { password: string }) {
      if (!password || password.length < 6) {
        return { data: { user: null }, error: { message: 'No se pudo cambiar la contraseña.' } }
      }
      return { data: { user: sessionStore.current?.user ?? null }, error: null }
    },
  }

  const functions = {
    async invoke(name: string, { body }: { body: Record<string, unknown> }) {
      const payload = body ?? {}

      if (name === 'submit-inquiry') {
        const store = ensureSeedData()
        const contactEmail = String(payload.email ?? '').trim().toLowerCase()
        let contact = ((store.contacts ?? []) as Contact[]).find((c) => c.email.toLowerCase() === contactEmail)
        if (!contact) {
          contact = {
            id: uid('contact'),
            first_name: String(payload.first_name ?? ''),
            last_name: String(payload.last_name ?? ''),
            email: contactEmail,
            phone: String(payload.phone ?? ''),
            customer_type: 'nuevo',
            lifecycle_stage: 'lead',
            marketing_consent: Boolean(payload.marketing_consent),
            marketing_consent_at: Boolean(payload.marketing_consent) ? nowIso() : null,
            source: String(payload.source ?? 'formulario'),
            created_at: nowIso(),
            updated_at: nowIso(),
          }
          ;(store.contacts as Contact[]).push(contact)
        }

        const requestCode = `DM-${Math.floor(100000 + Math.random() * 900000)}`
        const inquiry: Inquiry = {
          id: uid('inquiry'),
          contact_id: contact.id,
          request_code: requestCode,
          inquiry_type: String(payload.inquiry_type ?? 'otro') as Inquiry['inquiry_type'],
          product_name: payload.product_id ? `Producto ${String(payload.product_id)}` : null,
          event_type: payload.event_type ? String(payload.event_type) : null,
          event_date: payload.event_date ? String(payload.event_date) : null,
          quantity: payload.quantity ? String(payload.quantity) : null,
          message: payload.message ? String(payload.message) : null,
          source: String(payload.source ?? 'formulario') as Inquiry['source'],
          status: 'nueva',
          created_at: nowIso(),
        }
        ;(store.inquiries as Inquiry[]).push(inquiry)
        writeStore(store)

        return {
          data: {
            request_code: requestCode,
            first_name: contact.first_name,
            last_name: contact.last_name,
            email: contact.email,
            phone: contact.phone,
            inquiry_type: inquiry.inquiry_type,
            product_name: inquiry.product_name,
            message: inquiry.message,
            email_sent: true,
          },
          error: null,
        }
      }

      if (name === 'create-order') {
        const store = ensureSeedData()
        const customer = payload.customer as Record<string, unknown>
        const delivery = payload.delivery as Record<string, unknown>
        const paymentInfo = payload.payment as Record<string, unknown>
        const items = Array.isArray(payload.items) ? payload.items : []

        let contact = ((store.contacts ?? []) as Contact[]).find((c) => c.email.toLowerCase() === String(customer.email ?? '').trim().toLowerCase())
        if (!contact) {
          contact = {
            id: uid('contact'),
            first_name: String(customer.first_name ?? ''),
            last_name: String(customer.last_name ?? ''),
            email: String(customer.email ?? ''),
            phone: String(customer.phone ?? ''),
            customer_type: 'nuevo',
            lifecycle_stage: 'lead',
            marketing_consent: Boolean(customer.marketing_consent),
            marketing_consent_at: Boolean(customer.marketing_consent) ? nowIso() : null,
            source: 'checkout',
            created_at: nowIso(),
            updated_at: nowIso(),
          }
          ;(store.contacts as Contact[]).push(contact)
        }

        const subtotal = items.reduce((sum, item) => sum + Number((item as { unitPrice?: number; quantity?: number }).unitPrice ?? 0) * Number((item as { quantity?: number }).quantity ?? 0), 0)
        const deliveryFee = delivery.type === 'delivery' ? 15 : 0
        const total = subtotal + deliveryFee
        const orderCode = `DMO-${Math.floor(1000 + Math.random() * 9000)}`
        const order: Order = {
          id: uid('order'),
          order_code: orderCode,
          contact_id: contact.id,
          delivery_type: String(delivery.type ?? 'delivery') as 'delivery' | 'recojo',
          district: String(delivery.district ?? ''),
          address: String(delivery.address ?? ''),
          reference: String(delivery.reference ?? ''),
          requested_date: String(delivery.requested_date ?? ''),
          comments: String(delivery.comments ?? ''),
          subtotal,
          delivery_fee: deliveryFee,
          total,
          status: 'recibido',
          created_at: nowIso(),
        }
        ;(store.orders as Order[]).push(order)

        const paymentRecord: Payment = {
          id: uid('payment'),
          order_id: order.id,
          method: String(paymentInfo.method ?? 'yape') as Payment['method'],
          amount: total,
          operation_number: String(paymentInfo.operation_number ?? ''),
          status: 'pendiente',
          verified_at: null,
          created_at: nowIso(),
        }
        ;(store.payments as Payment[]).push(paymentRecord)
        writeStore(store)

        return {
          data: {
            order_code: orderCode,
            subtotal,
            delivery_fee: deliveryFee,
            total,
            payment_method: String(paymentInfo.method ?? 'yape') as any,
            payment_status: 'pendiente',
            delivery_type: order.delivery_type,
            district: order.district,
            items: items.map((item) => ({
              product_name: String((item as { name?: string }).name ?? 'Producto'),
              unit_price: Number((item as { unitPrice?: number }).unitPrice ?? 0),
              quantity: Number((item as { quantity?: number }).quantity ?? 1),
              options: (item as { options?: Record<string, unknown> }).options ?? {},
              subtotal: Number((item as { unitPrice?: number }).unitPrice ?? 0) * Number((item as { quantity?: number }).quantity ?? 1),
            })),
            first_name: contact.first_name,
            email: contact.email,
            email_sent: true,
          },
          error: null,
        }
      }

      if (name === 'admin-email') {
        const action = String(payload.action ?? 'config')
        const store = ensureSeedData()

        if (action === 'config') {
          const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL_DOMAIN as string | undefined)?.trim()
          const testRecipients = [
            `${DEFAULT_ADMIN_USER}@local.demo`,
            adminEmail ? `${DEFAULT_ADMIN_USER}@${adminEmail}` : `${DEFAULT_ADMIN_USER}@local.demo`,
          ]
          return {
            data: {
              configured: true,
              sender_email: 'hello@dulcemomento.pe',
              sender_name: 'Dulce Momento',
              test_recipients: [...new Set(testRecipients)],
            },
            error: null,
          }
        }

        if (action === 'preview') {
          const subject = String(payload.subject ?? 'Campaña de Dulce Momento')
          const html = String(payload.html ?? '<p>Contenido de prueba.</p>')
          return {
            data: {
              subject,
              html: html || '<p>Contenido de prueba.</p>',
            },
            error: null,
          }
        }

        if (action === 'test') {
          const email = String(payload.to ?? 'admin@local.demo')
          const events = (store.email_events ?? []) as { id: string; campaign_id: string | null; type: string; email: string }[]
          events.push({ id: uid('email_event'), campaign_id: null, type: 'sent', email })
          store.email_events = events
          writeStore(store)
          return { data: { ok: true }, error: null }
        }

        if (action === 'send') {
          const contactIds = Array.isArray(payload.contact_ids) ? payload.contact_ids.map(String) : []
          const contacts = ((store.contacts ?? []) as Contact[]).filter((c) => contactIds.includes(c.id))
          const scheduledAt = payload.scheduled_at ? String(payload.scheduled_at) : null
          const status = scheduledAt ? 'programada' : 'enviada'
          const campaignId = String(payload.campaign_id ?? uid('campaign'))
          const campaign = ((store.campaigns ?? []) as Campaign[]).find((c) => c.id === campaignId)
          if (campaign) {
            campaign.status = status
            campaign.sent_at = scheduledAt ?? nowIso()
            campaign.recipients_count = contacts.length
            campaign.scheduled_at = scheduledAt
            campaign.error = null
          } else {
            const created: Campaign = {
              id: campaignId,
              name: String(payload.name ?? 'Campaña local'),
              subject: String(payload.subject ?? 'Sin asunto'),
              sender_name: String(payload.sender_name ?? 'Dulce Momento'),
              kind: String(payload.kind ?? 'comercial') as Campaign['kind'],
              html: String(payload.html ?? ''),
              segment: String(payload.segment ?? 'manual'),
              status,
              scheduled_at: scheduledAt,
              sent_at: scheduledAt ?? nowIso(),
              recipients_count: contacts.length,
              error: null,
              created_at: nowIso(),
            }
            ;(store.campaigns as Campaign[]).push(created)
          }

          const events = (store.email_events ?? []) as { id: string; campaign_id: string | null; type: string; email: string }[]
          for (const contact of contacts) {
            events.push({ id: uid('email_event'), campaign_id: campaignId, type: 'sent', email: contact.email })
          }
          store.email_events = events
          writeStore(store)

          return {
            data: {
              status,
              recipients: contacts.length,
              excluded: 0,
              sent: contacts.length,
              failed: 0,
            },
            error: null,
          }
        }

        return { data: { ok: true }, error: null }
      }

      if (name === 'unsubscribe') {
        return { data: { ok: true }, error: null }
      }

      if (name === 'run-automations') {
        return { data: { campaigns: 0, sent: 0, stopped: 0, completed: 0, failed: 0 }, error: null }
      }

      return { data: null, error: { message: `No existe una función local para ${name}` } }
    },
  }

  return {
    auth,
    functions,
    from(table: string) {
      return new OfflineQueryBuilder(table)
    },
    rpc: async (name: string, params: Record<string, unknown> = {}) => {
      const data = ensureSeedData()
      if (name === 'admin_dashboard_metrics') {
        return { data: computeMetrics(), error: null }
      }
      if (name === 'admin_set_payment_status') {
        const paymentId = String(params.p_payment ?? '')
        const status = String(params.p_status ?? 'pendiente')
        const payment = ((data.payments ?? []) as Payment[]).find((p) => p.id === paymentId)
        if (!payment) return { data: null, error: { message: 'Pago no encontrado' } }
        payment.status = status as Payment['status']
        payment.verified_at = nowIso()
        writeStore(data)
        return { data: payment, error: null }
      }
      return { data: null, error: { message: `RPC local no implementada: ${name}` } }
    },
  } as const
}

export function isOfflineMode() {
  return typeof window !== 'undefined' && (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY)
}
