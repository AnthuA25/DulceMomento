// Pruebas de la base de datos sobre un PostgreSQL real en memoria (PGlite).
// Ejecutan la migración tal cual y cubren las pruebas obligatorias 1, 2, 3, 4, 5, 7 y 8.
// TODOS los registros creados aquí son DATOS DEMOSTRATIVOS y viven solo en memoria.
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { filterEligibleRecipients } from '../supabase/functions/_shared/rules.ts'

// Equivalente mínimo del entorno de Supabase: roles y esquema auth.
const SUPABASE_PRELUDE = `
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public, auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
`

let db: PGlite
let adminId: string

const one = async <T = Record<string, any>>(sql: string, params: unknown[] = []) =>
  (await db.query<T>(sql, params)).rows[0]

/** Ejecuta SQL con el rol y el usuario indicados, como lo haría PostgREST. */
async function as<T>(role: 'anon' | 'authenticated', userId: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set request.jwt.claim.sub = '${userId ?? ''}'; set role ${role};`)
  try {
    return await fn()
  } finally {
    await db.exec(`reset role; reset request.jwt.claim.sub;`)
  }
}

const inquiry = (over: Record<string, unknown> = {}) => ({
  first_name: 'María', last_name: 'López (demostrativo)', email: 'maria@ejemplo.com', phone: '999 000 111',
  inquiry_type: 'otro', product_id: 'keke-de-chocolate', message: 'Consulta de prueba', source: 'formulario',
  marketing_consent: false, ...over,
})
const submit = async (over: Record<string, unknown> = {}) =>
  (await one(`select submit_inquiry($1::jsonb) as r`, [JSON.stringify(inquiry(over))])).r

const order = (over: Record<string, unknown> = {}) => ({
  customer: { first_name: 'Carla', last_name: 'Ríos (demostrativo)', email: 'carla@ejemplo.com', phone: '999 222 333', marketing_consent: true },
  delivery: { type: 'delivery', district: 'San Isidro', address: 'Av. Demostrativa 123', requested_date: '2027-01-15' },
  payment: { method: 'yape', operation_number: '' },
  items: [{ product_id: 'keke-de-chocolate', quantity: 2, options: { sabor: 'Chocolate con manjar', dedicatoria: 'Feliz día' } },
          { product_id: 'keke-de-cumpleanos', quantity: 1, options: {} }],
  ...over,
})
const createOrder = async (over: Record<string, unknown> = {}) =>
  (await one(`select create_order($1::jsonb) as r`, [JSON.stringify(order(over))])).r

beforeAll(async () => {
  db = new PGlite()
  await db.exec(SUPABASE_PRELUDE)
  await db.exec(readFileSync('supabase/migrations/0001_schema.sql', 'utf8'))
  await db.exec(readFileSync('supabase/seed.sql', 'utf8'))
  adminId = (await one(`insert into auth.users (email) values ('admin@ejemplo.com') returning id`)).id
  await db.query(`insert into admin_profiles (user_id) values ($1)`, [adminId])
})

describe('PRUEBA 1 · formulario → contacto + consulta + código', () => {
  it('registra el contacto, crea la consulta y genera un código DM-XXXXXX', async () => {
    const r = await submit()
    expect(r.request_code).toMatch(/^DM-\d{6}$/)
    expect(r.is_new_contact).toBe(true)
    expect(r.customer_type).toBe('nuevo')
    expect(r.product_name).toBe('Keke de chocolate')
    const c = await one(`select * from contacts where email = 'maria@ejemplo.com'`)
    expect(c.lifecycle_stage).toBe('lead')
    expect((await one(`select count(*)::int n from inquiries where contact_id = $1`, [c.id])).n).toBe(1)
  })

  it('genera códigos únicos', async () => {
    const codes = new Set<string>()
    for (let i = 0; i < 25; i++) codes.add((await submit({ email: `lote${i}@ejemplo.com` })).request_code)
    expect(codes.size).toBe(25)
    await db.exec(`delete from contacts where email like 'lote%'`)
  })

  it('rechaza correos inválidos', async () => {
    await expect(submit({ email: 'no-es-un-correo' })).rejects.toThrow(/email_invalido/)
  })
})

describe('PRUEBA 2 · mismo correo, segunda consulta', () => {
  it('no duplica el contacto, crea la segunda consulta y pasa a Recurrente', async () => {
    const r = await submit({ email: '  MARIA@ejemplo.com ', inquiry_type: 'delivery', first_name: 'Otra persona' })
    expect(r.is_new_contact).toBe(false)
    expect(r.customer_type).toBe('recurrente')
    expect(r.inquiries_count).toBe(2)
    expect((await one(`select count(*)::int n from contacts where email = 'maria@ejemplo.com'`)).n).toBe(1)
    const row = await one(`select * from contact_directory where email = 'maria@ejemplo.com'`)
    expect(row.inquiries_count).toBe(2)
    expect(row.first_name).toBe('María')
    // Recurrente por consultas ≠ cliente recurrente del lifecycle.
    expect(row.lifecycle_stage).toBe('interesado')
  })
})

describe('PRUEBAS 3, 4 y 5 · consentimiento de marketing', () => {
  it('sin consentimiento: no entra a campañas comerciales ni a la secuencia de leads', async () => {
    const c = await one(`select * from contacts where email = 'maria@ejemplo.com'`)
    expect(c.marketing_consent).toBe(false)
    expect((await one(`select count(*)::int n from automation_enrollments where contact_id = $1`, [c.id])).n).toBe(0)
  })

  it('con consentimiento: queda elegible, con fecha y registro histórico', async () => {
    const r = await submit({ email: 'ana@ejemplo.com', first_name: 'Ana', marketing_consent: true })
    const c = await one(`select * from contacts where id = $1`, [r.contact_id])
    expect(c.marketing_consent).toBe(true)
    expect(c.marketing_consent_at).not.toBeNull()
    expect((await one(`select count(*)::int n from marketing_consents where contact_id = $1 and granted`, [c.id])).n).toBe(1)
    const e = await one(
      `select a.key from automation_enrollments e join automations a on a.id = e.automation_id where e.contact_id = $1`, [c.id])
    expect(e.key).toBe('lead_nurture')
  })

  it('una consulta posterior sin marcar la casilla no revoca el consentimiento', async () => {
    await submit({ email: 'ana@ejemplo.com', marketing_consent: false })
    expect((await one(`select marketing_consent from contacts where email = 'ana@ejemplo.com'`)).marketing_consent).toBe(true)
  })

  it('una campaña COMERCIAL excluye automáticamente a quien no dio consentimiento', async () => {
    const { rows } = await db.query<any>(
      `select id, email, first_name, last_name, marketing_consent, (inquiries_count + orders_count) > 0 as has_relationship
       from contact_directory`)
    const comercial = filterEligibleRecipients('comercial', rows)
    expect(comercial.eligible.map((c) => c.email)).toEqual(['ana@ejemplo.com'])
    expect(comercial.excluded.map((c) => c.email)).toContain('maria@ejemplo.com')
    expect(filterEligibleRecipients('operativa', rows).eligible).toHaveLength(2)
  })

  it('la baja por enlace retira el consentimiento y detiene la secuencia', async () => {
    const c = await one(`select id, unsubscribe_token from contacts where email = 'ana@ejemplo.com'`)
    expect((await one(`select unsubscribe_contact($1) ok`, [c.unsubscribe_token])).ok).toBe(true)
    expect((await one(`select marketing_consent from contacts where id = $1`, [c.id])).marketing_consent).toBe(false)
    expect((await one(`select status from automation_enrollments where contact_id = $1`, [c.id])).status).toBe('detenida')
  })
})

describe('PRUEBA 7 · checkout → pedido, pago y lifecycle', () => {
  let result: any

  it('crea el pedido con precios calculados en la base y pago PENDIENTE', async () => {
    result = await createOrder()
    expect(result.order_code).toMatch(/^DMP-\d{6}$/)
    expect(Number(result.subtotal)).toBe(150)
    expect(result.delivery_fee).toBeNull() // San Isidro sin tarifa configurada = por confirmar
    expect(Number(result.total)).toBe(150)
    expect(result.payment_status).toBe('pendiente')
    const items = (await db.query<any>(`select * from order_items where order_id = $1 order by quantity desc`, [result.order_id])).rows
    expect(items).toHaveLength(2)
    expect(items[0].options).toEqual({ sabor: 'Chocolate con manjar', dedicatoria: 'Feliz día' })
    expect((await one(`select lifecycle_stage from contacts where id = $1`, [result.contact_id])).lifecycle_stage).toBe('interesado')
  })

  it('con número de operación el pago queda EN VERIFICACIÓN, nunca pagado', async () => {
    const r = await createOrder({ payment: { method: 'plin', operation_number: '123456' } })
    expect(r.payment_status).toBe('en_verificacion')
  })

  it('no acepta precios enviados por el cliente ni productos sin precio', async () => {
    await expect(createOrder({ items: [{ product_id: 'keke-personalizado', quantity: 1 }] })).rejects.toThrow(/producto_no_disponible/)
    await expect(createOrder({ items: [] })).rejects.toThrow(/carrito_vacio/)
    await expect(createOrder({ items: [{ product_id: 'keke-de-vainilla', quantity: 0 }] })).rejects.toThrow(/cantidad_invalida/)
  })

  it('aplica la tarifa de delivery configurada para el distrito', async () => {
    await db.exec(`update site_settings set value = '[{"name":"San Isidro","fee":8}]' where key = 'delivery_zones'`)
    const r = await createOrder({ customer: { ...order().customer, email: 'tarifa@ejemplo.com' } })
    expect(Number(r.delivery_fee)).toBe(8)
    expect(Number(r.total)).toBe(158)
    await db.exec(`update site_settings set value = '[{"name":"San Isidro","fee":null}]' where key = 'delivery_zones'`)
  })

  it('solo un administrador puede verificar el pago; al pagarse pasa a CLIENTE y a posventa', async () => {
    const pay = await one(`select id from payments where order_id = $1`, [result.order_id])
    await expect(as('authenticated', crypto.randomUUID(), () =>
      db.query(`select admin_set_payment_status($1, 'pagado')`, [pay.id]))).rejects.toThrow(/no_autorizado/)
    await expect(as('anon', null, () =>
      db.query(`select admin_set_payment_status($1, 'pagado')`, [pay.id]))).rejects.toThrow(/permission denied/)

    await as('authenticated', adminId, () => db.query(`select admin_set_payment_status($1, 'pagado')`, [pay.id]))
    const c = await one(`select * from contacts where id = $1`, [result.contact_id])
    expect(c.lifecycle_stage).toBe('cliente')
    expect((await one(`select status from orders where id = $1`, [result.order_id])).status).toBe('confirmado')

    const enrollments = (await db.query<any>(
      `select a.key, e.status, e.stop_reason from automation_enrollments e
       join automations a on a.id = e.automation_id where e.contact_id = $1 and e.order_id = $2`,
      [c.id, result.order_id])).rows
    expect(enrollments).toContainEqual({ key: 'pedido_pendiente', status: 'detenida', stop_reason: 'compra_confirmada' })
    expect(enrollments).toContainEqual({ key: 'posventa', status: 'activa', stop_reason: null })
  })

  it('quien compra sale de la secuencia de conversión de leads', async () => {
    const lead = await submit({ email: 'lead@ejemplo.com', first_name: 'Lead', marketing_consent: true })
    const o = await createOrder({ customer: { ...order().customer, email: 'lead@ejemplo.com' } })
    const pay = await one(`select id from payments where order_id = $1`, [o.order_id])
    await as('authenticated', adminId, () => db.query(`select admin_set_payment_status($1, 'pagado')`, [pay.id]))
    const e = await one(
      `select e.status, e.stop_reason from automation_enrollments e join automations a on a.id = e.automation_id
       where a.key = 'lead_nurture' and e.contact_id = $1`, [lead.contact_id])
    expect(e).toEqual({ status: 'detenida', stop_reason: 'compra_confirmada' })
  })

  it('segunda compra pagada → CLIENTE RECURRENTE (independiente de Nuevo/Recurrente por consultas)', async () => {
    const o = await createOrder()
    const pay = await one(`select id from payments where order_id = $1`, [o.order_id])
    await as('authenticated', adminId, () => db.query(`select admin_set_payment_status($1, 'pagado')`, [pay.id]))
    const c = await one(`select * from contacts where email = 'carla@ejemplo.com'`)
    expect(c.lifecycle_stage).toBe('cliente_recurrente')
    expect(c.customer_type).toBe('nuevo') // no hizo consultas: sigue "nuevo" por consultas
  })
})

describe('PRUEBA 8 · seguridad (RLS)', () => {
  it('una persona no autenticada no puede leer datos de clientes', async () => {
    for (const table of ['contacts', 'inquiries', 'orders', 'payments', 'crm_notes', 'campaigns', 'email_events']) {
      await expect(as('anon', null, () => db.query(`select * from ${table}`)), table).rejects.toThrow(/permission denied/)
    }
    await expect(as('anon', null, () => db.query(`select * from contact_directory`))).rejects.toThrow(/permission denied/)
  })

  it('un usuario autenticado que no es administrador no ve ni modifica nada', async () => {
    const stranger = crypto.randomUUID()
    expect((await as('authenticated', stranger, () => db.query(`select * from contacts`))).rows).toHaveLength(0)
    expect((await as('authenticated', stranger, () => db.query(`select * from orders`))).rows).toHaveLength(0)
    await expect(as('authenticated', stranger, () => db.query(`select admin_dashboard_metrics()`))).rejects.toThrow(/no_autorizado/)
    await expect(as('authenticated', stranger, () =>
      db.query(`insert into admin_profiles (user_id) values ($1)`, [stranger]))).rejects.toThrow(/row-level security/)
  })

  it('el público solo ve el catálogo activo y la configuración pública', async () => {
    expect((await as('anon', null, () => db.query(`select * from products`))).rows).toHaveLength(7)
    const keys = (await as('anon', null, () => db.query<any>(`select key from site_settings`))).rows.map((r) => r.key)
    expect(keys).toContain('whatsapp_number')
    expect(keys).not.toContain('admin_email')
    expect(keys).not.toContain('sender_email')
    await expect(as('anon', null, () => db.query(`select submit_inquiry('{}'::jsonb)`))).rejects.toThrow(/permission denied/)
    await expect(as('anon', null, () => db.query(`select create_order('{}'::jsonb)`))).rejects.toThrow(/permission denied/)
  })

  it('el administrador ve el CRM y las métricas se calculan desde la base', async () => {
    const rows = (await as('authenticated', adminId, () => db.query<any>(`select * from contact_directory`))).rows
    const m = (await as('authenticated', adminId, () => db.query<any>(`select admin_dashboard_metrics() m`))).rows[0].m
    expect(m.total_contacts).toBe(rows.length)
    expect(m.new_contacts + m.recurrent_contacts).toBe(rows.length)
    expect(m.inquiries).toBe((await one(`select count(*)::int n from inquiries`)).n)
    expect(m.buyers).toBe(2)
    expect(Number(m.conversion_rate)).toBeCloseTo((2 / rows.length) * 100, 1)
  })
})

describe('anti-spam', () => {
  it('limita las peticiones por clave y ventana', async () => {
    const hit = async () => (await one(`select check_rate_limit('prueba:ip', 3, 600) ok`)).ok
    expect([await hit(), await hit(), await hit(), await hit()]).toEqual([true, true, true, false])
  })
})
