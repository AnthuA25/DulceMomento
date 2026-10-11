// Backend local para las pruebas de extremo a extremo.
// Atiende las mismas rutas que usa el sitio (/rest/v1, /auth/v1, /functions/v1)
// ejecutando la MIGRACIÓN REAL sobre PostgreSQL en memoria (PGlite), con RLS activo.
// No envía correos. Todo lo que crea son DATOS DEMOSTRATIVOS en memoria.
import { PGlite } from '@electric-sql/pglite'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { renderVariables, validateInquiry } from '../../supabase/functions/_shared/rules.ts'
import { sanitizeEmailHtml } from '../../supabase/functions/_shared/sanitize.ts'
import { emailLayout, styleContent } from '../../supabase/functions/_shared/templates.ts'

const PRELUDE = `
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public, auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
`

export interface Reply { status: number; body: unknown }
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')

export async function createBackend() {
  const db = new PGlite()
  await db.exec(PRELUDE)
  await db.exec(readFileSync('supabase/migrations/0001_schema.sql', 'utf8'))
  await db.exec(readFileSync('supabase/seed.sql', 'utf8'))

  // Administrador de prueba: la contraseña se genera en cada ejecución.
  const admin = { id: randomUUID(), email: 'admin@ejemplo.com', password: randomUUID() }
  await db.query(`insert into auth.users (id, email) values ($1, $2)`, [admin.id, admin.email])
  await db.query(`insert into admin_profiles (user_id) values ($1)`, [admin.id])
  const token = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: admin.id, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })}.e2e`
  const user = { id: admin.id, email: admin.email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() }

  /** Ejecuta una consulta con el rol que tendría la petición en Supabase (aplica RLS). */
  async function as<T = any>(isAdmin: boolean, sql: string, params: unknown[] = []): Promise<T[]> {
    await db.exec(`set request.jwt.claim.sub = '${isAdmin ? admin.id : ''}'; set role ${isAdmin ? 'authenticated' : 'anon'};`)
    try {
      return (await db.query<T>(sql, params)).rows
    } finally {
      await db.exec(`reset role; reset request.jwt.claim.sub;`)
    }
  }

  const EMBEDS: Record<string, string> = {
    orders: `, (select to_jsonb(c) from (select first_name, last_name, email, phone from contacts where id = t.contact_id) c) as contact,
      coalesce((select jsonb_agg(i) from order_items i where i.order_id = t.id), '[]') as order_items,
      coalesce((select jsonb_agg(p) from payments p where p.order_id = t.id), '[]') as payments`,
    automations: `, coalesce((select jsonb_agg(s order by s.step_order) from automation_steps s where s.automation_id = t.id), '[]') as automation_steps`,
  }

  function where(url: URL, params: unknown[]): string {
    const clauses: string[] = []
    for (const [column, raw] of url.searchParams) {
      if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(column) || column.includes('.')) continue
      if (!/^[a-z_]+$/.test(column)) throw new Error(`filtro no soportado: ${column}`)
      if (raw === 'not.is.null') clauses.push(`t.${column} is not null`)
      else if (raw.startsWith('eq.')) {
        params.push(raw.slice(3))
        clauses.push(`t.${column}::text = $${params.length}`)
      } else throw new Error(`filtro no soportado: ${column}=${raw}`)
    }
    return clauses.length ? ` where ${clauses.join(' and ')}` : ''
  }

  async function rest(method: string, url: URL, headers: Record<string, string>, body: any): Promise<Reply> {
    const isAdmin = headers.authorization === `Bearer ${token}`
    const path = url.pathname.replace('/rest/v1/', '')
    const single = (headers.accept ?? '').includes('vnd.pgrst.object')
    const finish = (rows: any[]): Reply =>
      single ? (rows.length === 1 ? { status: 200, body: rows[0] } : { status: 406, body: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' } })
        : { status: 200, body: rows }

    if (path.startsWith('rpc/')) {
      const fn = path.slice(4)
      if (!/^[a-z_]+$/.test(fn)) throw new Error('rpc inválido')
      const args = Object.entries(body ?? {})
      const rows = await as(isAdmin, `select ${fn}(${args.map(([k], i) => `${k} => $${i + 1}`).join(', ')}) as r`, args.map(([, v]) => v))
      return { status: 200, body: rows[0].r }
    }

    const table = path
    if (!/^[a-z_]+$/.test(table)) throw new Error('tabla inválida')
    const params: unknown[] = []

    if (method === 'GET') {
      const order = url.searchParams.getAll('order').filter((o) => /^[a-z_]+\.(asc|desc)$/.test(o)).map((o) => `t.${o.replace('.', ' ')}`)
      const filter = where(url, params)
      return finish(await as(isAdmin, `select t.*${EMBEDS[table] ?? ''} from ${table} t${filter}${order.length ? ` order by ${order.join(', ')}` : ''}`, params))
    }
    if (method === 'POST') {
      const keys = Object.keys(body)
      const rows = await as(isAdmin, `insert into ${table} as t (${keys.join(', ')}) values (${keys.map((_, i) => `$${i + 1}`).join(', ')}) returning t.*`, Object.values(body))
      return finish(rows)
    }
    if (method === 'PATCH') {
      const keys = Object.keys(body)
      // site_settings.value es jsonb: cualquier valor se guarda como JSON, igual que hace PostgREST.
      const values = Object.entries(body).map(([k, v]) =>
        (table === 'site_settings' && k === 'value') || (v !== null && typeof v === 'object') ? JSON.stringify(v) : v)
      params.push(...values)
      const set = keys.map((k, i) => `${k} = $${i + 1}`).join(', ')
      return finish(await as(isAdmin, `update ${table} as t set ${set}${where(url, params)} returning t.*`, params))
    }
    throw new Error(`método no soportado: ${method}`)
  }

  async function functions(name: string, headers: Record<string, string>, body: any): Promise<Reply> {
    const isAdmin = headers.authorization === `Bearer ${token}`
    const service = async (sql: string, params: unknown[]) => (await db.query<any>(sql, params)).rows[0].r

    if (name === 'submit-inquiry') {
      if (body.website) return { status: 400, body: { error: 'No pudimos procesar tu consulta.' } }
      const parsed = validateInquiry(body)
      if (!parsed.ok) return { status: 400, body: { error: parsed.error } }
      const r = await service(`select submit_inquiry($1::jsonb) as r`, [JSON.stringify(parsed.data)])
      return { status: 200, body: {
        request_code: r.request_code, first_name: r.first_name, last_name: r.last_name, email: r.email, phone: r.phone,
        inquiry_type: parsed.data.inquiry_type, product_name: r.product_name, message: parsed.data.message || null,
        email_sent: false, // este backend de pruebas no envía correos
      } }
    }
    if (name === 'create-order') {
      try {
        const r = await service(`select create_order($1::jsonb) as r`, [JSON.stringify({
          customer: body.customer, delivery: { ...body.delivery, requested_date: body.delivery.requested_date }, payment: body.payment, items: body.items,
        })])
        const { order_id: _o, contact_id: _c, ...result } = r
        return { status: 200, body: { ...result, email_sent: false } }
      } catch (e) {
        return { status: 400, body: { error: String((e as Error).message) } }
      }
    }
    if (name === 'admin-email') {
      if (!isAdmin) return { status: 401, body: { error: 'No autorizado.' } }
      if (body.action === 'config') return { status: 200, body: { configured: false, sender_email: null, sender_name: 'Dulce Momento', test_recipients: [admin.email] } }
      if (body.action === 'preview') {
        const vars = { nombre: 'María (dato demostrativo)', apellido: 'López (dato demostrativo)', correo: 'correo.demostrativo@ejemplo.com', site_url: 'http://localhost' }
        const html = emailLayout({
          body: styleContent(renderVariables(sanitizeEmailHtml(body.html), vars)),
          unsubscribeUrl: body.kind !== 'operativa' ? 'http://localhost/baja?token=vista-previa' : undefined,
        })
        return { status: 200, body: { subject: renderVariables(body.subject, vars), html } }
      }
      return { status: 502, body: { error: 'El servicio de email no está configurado (RESEND_API_KEY y remitente).' } }
    }
    return { status: 404, body: { error: 'función no disponible en pruebas' } }
  }

  async function auth(method: string, url: URL, headers: Record<string, string>, body: any): Promise<Reply> {
    if (url.pathname.endsWith('/token') && method === 'POST') {
      if (body.email !== admin.email || body.password !== admin.password) {
        return { status: 400, body: { error: 'invalid_grant', error_description: 'Invalid login credentials' } }
      }
      return { status: 200, body: { access_token: token, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'e2e', user } }
    }
    if (url.pathname.endsWith('/user')) {
      return headers.authorization === `Bearer ${token}` ? { status: 200, body: user } : { status: 401, body: { message: 'no autorizado' } }
    }
    if (url.pathname.endsWith('/logout')) return { status: 204, body: null }
    return { status: 404, body: {} }
  }

  async function handle(method: string, rawUrl: string, headers: Record<string, string>, bodyText: string | null): Promise<Reply> {
    const url = new URL(rawUrl)
    const body = bodyText ? JSON.parse(bodyText) : null
    try {
      if (url.pathname.startsWith('/rest/v1/')) return await rest(method, url, headers, body)
      if (url.pathname.startsWith('/functions/v1/')) return await functions(url.pathname.split('/').pop()!, headers, body)
      if (url.pathname.startsWith('/auth/v1/')) return await auth(method, url, headers, body)
      return { status: 404, body: {} }
    } catch (e) {
      const message = (e as Error).message
      return { status: /permission denied|row-level security|no_autorizado/.test(message) ? 403 : 500, body: { message } }
    }
  }

  return { db, admin, handle }
}
