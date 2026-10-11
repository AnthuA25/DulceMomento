// Pruebas de lógica pura: carrito (PRUEBA 6), SEO (PRUEBA 9), saneado de HTML,
// plantillas de correo, segmentación y reglas de automatización.
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { activeProducts, getProduct, products } from '../src/data/catalog.ts'
import { faqData, matchFaq } from '../src/data/faq.ts'
import type { CartItem, ContactRow } from '../src/types/index.ts'
import * as cart from '../src/utils/cart.ts'
import { selectSegment } from '../src/utils/segments.ts'
import { faqSchema, productSchema } from '../src/utils/structuredData.ts'
import { automationGuard, renderVariables, validateInquiry } from '../supabase/functions/_shared/rules.ts'
import { sanitizeEmailHtml } from '../supabase/functions/_shared/sanitize.ts'
import { inquiryConfirmationEmail, inquiryInternalEmail, styleContent } from '../supabase/functions/_shared/templates.ts'

const chocolate = getProduct('keke-de-chocolate')!
const reuniones = getProduct('keke-para-reuniones')!
const personalizado = getProduct('keke-personalizado')!

describe('PRUEBA 6 · carrito', () => {
  it('agrega, suma cantidades de la misma línea y separa personalizaciones distintas', () => {
    let items: CartItem[] = []
    items = cart.addItem(items, chocolate, 1, { sabor: 'Chocolate' })
    items = cart.addItem(items, chocolate, 2, { sabor: 'Chocolate' })
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(3)

    items = cart.addItem(items, chocolate, 1, { sabor: 'Chocolate', dedicatoria: 'Feliz día' })
    expect(items).toHaveLength(2)
    expect(items[1].options).toEqual({ sabor: 'Chocolate', dedicatoria: 'Feliz día' })
  })

  it('modifica la cantidad dentro de los límites y elimina líneas', () => {
    let items = cart.addItem([], chocolate, 1, {})
    items = cart.addItem(items, reuniones, 1, {})
    items = cart.updateQuantity(items, items[0].lineId, 4)
    expect(items[0].quantity).toBe(4)
    expect(cart.updateQuantity(items, items[0].lineId, 0)[0].quantity).toBe(1)
    expect(cart.updateQuantity(items, items[0].lineId, 999)[0].quantity).toBe(cart.MAX_QUANTITY)
    items = cart.removeItem(items, items[0].lineId)
    expect(items.map((i) => i.productId)).toEqual(['keke-para-reuniones'])
  })

  it('calcula subtotal, delivery y total', () => {
    let items = cart.addItem([], chocolate, 2, {})
    items = cart.addItem(items, reuniones, 1, {})
    expect(cart.itemCount(items)).toBe(3)
    expect(cart.subtotal(items)).toBe(150)

    const zones = [{ name: 'San Isidro', fee: 8 }, { name: 'Miraflores', fee: null }]
    expect(cart.totals(items, cart.deliveryFee('delivery', 'san isidro', zones))).toEqual(
      { subtotal: 150, deliveryFee: 8, total: 158, feePending: false })
    // Tarifa sin configurar o distrito desconocido: queda por confirmar y no se inventa un costo.
    expect(cart.totals(items, cart.deliveryFee('delivery', 'Miraflores', zones)).feePending).toBe(true)
    expect(cart.totals(items, cart.deliveryFee('delivery', 'Surco', zones))).toMatchObject({ total: 150, feePending: true })
    expect(cart.deliveryFee('recojo', '', zones)).toBe(0)
  })

  it('no permite agregar al carrito un producto sin precio (solo cotización)', () => {
    expect(cart.addItem([], personalizado, 1, {})).toHaveLength(0)
  })

  it('descarta opciones vacías y describe la personalización', () => {
    const [item] = cart.addItem([], chocolate, 1, { sabor: 'Chocolate', dedicatoria: '  ', empaque_regalo: true })
    expect(item.options).toEqual({ sabor: 'Chocolate', empaque_regalo: true })
    expect(cart.describeOptions(item.options)).toEqual([
      { label: 'Sabor', value: 'Chocolate' }, { label: 'Empaque para regalo', value: 'Sí' }])
  })
})

describe('catálogo: una sola fuente de datos', () => {
  it('tiene slugs e ids únicos, imágenes existentes y texto alternativo', () => {
    expect(new Set(products.map((p) => p.slug)).size).toBe(products.length)
    for (const p of products) {
      expect(p.id).toBe(p.slug)
      expect(existsSync(`public${p.image}`), p.image).toBe(true)
      expect(p.imageAlt.length).toBeGreaterThan(15)
    }
  })

  it('el seed de la base coincide con el catálogo', () => {
    const seed = readFileSync('supabase/seed.sql', 'utf8')
    for (const p of products) expect(seed).toContain(`'${p.slug}'`)
  })
})

describe('PRUEBA 9 · SEO y AEO', () => {
  it('el sitemap incluye solo páginas públicas indexables', () => {
    const sitemap = readFileSync('public/sitemap.xml', 'utf8')
    for (const path of ['/productos', '/kekes-personalizados', '/contacto', ...activeProducts.map((p) => `/productos/${p.slug}`)]) {
      expect(sitemap).toContain(`${path}</loc>`)
    }
    for (const hidden of ['admin', 'carrito', 'checkout', 'gracias']) expect(sitemap).not.toContain(hidden)
  })

  it('robots.txt bloquea la administración y enlaza el sitemap', () => {
    const robots = readFileSync('public/robots.txt', 'utf8')
    expect(robots).toMatch(/^Disallow: \/admin$/m)
    expect(robots).toMatch(/^Disallow: \/checkout$/m)
    expect(robots).toMatch(/^Sitemap: .+\/sitemap\.xml$/m)
  })

  it('cada página pública define title, description, canonical y un único H1', () => {
    for (const page of ['Products', 'ProductDetail', 'Personalizados', 'Contact']) {
      const source = readFileSync(`src/pages/${page}.tsx`, 'utf8')
      expect(source, page).toMatch(/<Seo\s[\s\S]*?title=[\s\S]*?description=[\s\S]*?path=/)
      expect(source.match(/<h1[\s>]/g) ?? [], page).toHaveLength(page === 'Contact' ? 0 : 1)
    }
    expect(readFileSync('src/pages/Home.tsx', 'utf8')).toContain('<Seo')
    expect(readFileSync('src/components/home/Hero.tsx', 'utf8').match(/<h1[\s>]/g)).toHaveLength(1)
    expect(readFileSync('src/pages/Personalizados.tsx', 'utf8')).toContain('Kekes Personalizados en Lima | Dulce Momento')
    expect(readFileSync('src/admin/AdminLayout.tsx', 'utf8')).toContain('noindex, nofollow')
  })

  it('los datos estructurados reflejan solo información real', () => {
    const schema = productSchema(chocolate) as any
    expect(schema.offers).toMatchObject({ price: '50.00', priceCurrency: 'PEN' })
    expect(productSchema(personalizado)).not.toHaveProperty('offers')
    expect(JSON.stringify(schema)).not.toMatch(/aggregateRating|review/i)
    expect(faqSchema().mainEntity).toHaveLength(faqData.length)
  })

  it('FAQ y Dulce Bot comparten respuestas con estructura pregunta → respuesta → detalle → CTA', () => {
    for (const f of faqData) {
      expect(f.question).toMatch(/^¿.+\?$/)
      expect(f.answer.length).toBeGreaterThan(20)
      expect(f.detail.length).toBeGreaterThan(20)
      expect(f.cta.to).toMatch(/^\//)
    }
    expect(matchFaq('hola, ¿hacen delivery a mi distrito?')?.id).toBe('delivery')
    expect(matchFaq('cuánto cuesta un keke')?.id).toBe('precios')
    expect(matchFaq('puedo pagar con yape?')?.id).toBe('pagos')
    expect(matchFaq('asdf qwerty')).toBeNull()
  })
})

describe('seguridad · saneado del HTML de campañas', () => {
  it('elimina scripts, manejadores de eventos, estilos y etiquetas no permitidas', () => {
    const dirty = `<h2 onclick="x()">Hola</h2><script>alert(1)</script><img src=x onerror=alert(1)>
      <p style="position:fixed">Texto <strong>fuerte</strong></p><iframe src="https://x.test"></iframe><style>p{}</style>`
    const clean = sanitizeEmailHtml(dirty)
    expect(clean).toContain('<h2>Hola</h2>')
    expect(clean).toContain('<p>Texto <strong>fuerte</strong></p>')
    expect(clean).not.toMatch(/script|onclick|onerror|iframe|style|<img|alert/i)
  })

  it('solo conserva enlaces http(s) y mailto', () => {
    expect(sanitizeEmailHtml('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>')
    expect(sanitizeEmailHtml('<a href="JaVa\tScRiPt:alert(1)">x</a>')).toBe('<a>x</a>')
    expect(sanitizeEmailHtml('<a href="data:text/html,x">x</a>')).toBe('<a>x</a>')
    expect(sanitizeEmailHtml('<a href="https://ejemplo.com/a?b=1" data-cta="1" onmouseover="x">Ver</a>'))
      .toBe('<a href="https://ejemplo.com/a?b=1" data-cta="1" target="_blank" rel="noopener noreferrer">Ver</a>')
  })

  it('neutraliza etiquetas rotas o anidadas para evadir el filtro', () => {
    expect(sanitizeEmailHtml('<scr<script>ipt>alert(1)</script>')).not.toMatch(/<script/i)
    expect(sanitizeEmailHtml('<p>1 < 2</p><svg/onload=alert(1)>')).not.toMatch(/<svg/i)
  })

  it('convierte los CTA en botones y reemplaza variables', () => {
    const html = styleContent(sanitizeEmailHtml('<p>Hola {{nombre}}</p><p><a href="https://ejemplo.com" data-cta="1">Ver kekes</a></p>'))
    expect(html).toContain('border-radius:999px')
    expect(html).toContain('>Ver kekes</a>')
    expect(renderVariables('Hola {{nombre}} {{ Apellido }}{{desconocida}}', { nombre: 'Ana', apellido: 'Paz' })).toBe('Hola Ana Paz')
  })
})

describe('correos transaccionales', () => {
  const data = {
    request_code: 'DM-148846', first_name: '<b>María</b>', last_name: 'López', email: 'maria@ejemplo.com', phone: '999000111',
    inquiry_type: 'cotizacion', product_name: 'Keke de chocolate', message: 'Para el sábado', marketing_consent: false, contact_id: 'abc',
  }

  it('la confirmación usa el asunto y el resumen solicitados, y escapa el contenido del usuario', () => {
    const mail = inquiryConfirmationEmail(data, 'https://sitio.test', '51999000111')
    expect(mail.subject).toBe('Hemos recibido tu consulta — Dulce Momento')
    for (const text of ['KEKES ARTESANALES', 'RESUMEN DE TU SOLICITUD', 'DM-148846', 'Cotización', 'Keke de chocolate', 'Para el sábado', 'Ver nuestros kekes', 'Hablar por WhatsApp', 'https://sitio.test/productos']) {
      expect(mail.html).toContain(text)
    }
    expect(mail.html).toContain('&lt;b&gt;María&lt;/b&gt;')
    expect(mail.html).not.toContain('<b>María</b>')
    expect(inquiryConfirmationEmail(data, 'https://sitio.test', null).html).not.toContain('Hablar por WhatsApp')
  })

  it('la notificación interna incluye el consentimiento y el enlace al CRM', () => {
    const mail = inquiryInternalEmail(data, 'https://sitio.test')
    expect(mail.subject).toBe('Nueva consulta DM-148846 — Dulce Momento')
    expect(mail.html).toContain('Consentimiento marketing')
    expect(mail.html).toContain('https://sitio.test/admin/contactos/abc')
  })
})

describe('validación de backend del formulario', () => {
  const valid = { first_name: 'Ana', last_name: 'Paz', email: 'ANA@ejemplo.com', phone: '999 000 111', inquiry_type: 'delivery' }
  it('normaliza datos válidos y nunca asume consentimiento', () => {
    const r = validateInquiry({ ...valid, marketing_consent: 'true', source: 'otro' })
    expect(r).toMatchObject({ ok: true, data: { email: 'ana@ejemplo.com', marketing_consent: false, source: 'formulario' } })
  })
  it('rechaza datos inválidos con mensajes claros', () => {
    expect(validateInquiry({ ...valid, email: 'ana@' })).toMatchObject({ ok: false })
    expect(validateInquiry({ ...valid, first_name: '' })).toMatchObject({ ok: false })
    expect(validateInquiry({ ...valid, inquiry_type: 'spam' })).toMatchObject({ ok: false })
    expect(validateInquiry({ ...valid, event_date: '15/01/2027' })).toMatchObject({ ok: false })
  })
})

describe('segmentación y automatizaciones', () => {
  const contact = (over: Partial<ContactRow>): ContactRow => ({
    id: over.email ?? 'x', first_name: 'N', last_name: 'A', email: 'a@ejemplo.com', phone: null, customer_type: 'nuevo',
    lifecycle_stage: 'lead', marketing_consent: false, marketing_consent_at: null, source: 'formulario', created_at: '', updated_at: '',
    inquiries_count: 1, orders_count: 0, last_inquiry_type: 'otro', last_product_name: null, last_activity_at: '', ...over,
  })
  const list = [
    contact({ email: 'si@ejemplo.com', marketing_consent: true }),
    contact({ email: 'no@ejemplo.com', marketing_consent: false, customer_type: 'recurrente' }),
    contact({ email: 'cliente@ejemplo.com', marketing_consent: true, lifecycle_stage: 'cliente' }),
  ]

  it('"Todos los contactos" en una campaña comercial solo incluye a quienes dieron consentimiento', () => {
    expect(selectSegment('todos', 'comercial', list).map((c) => c.email)).toEqual(['si@ejemplo.com', 'cliente@ejemplo.com'])
    expect(selectSegment('todos', 'operativa', list)).toHaveLength(3)
    expect(selectSegment('recurrentes', 'comercial', list)).toHaveLength(0)
    expect(selectSegment('clientes', 'comercial', list).map((c) => c.email)).toEqual(['cliente@ejemplo.com'])
  })

  it('la secuencia de leads se detiene si compró o retiró el consentimiento', () => {
    const base = { automationKey: 'lead_nurture', enabled: true, requiresMarketingConsent: true, marketingConsent: true, paidOrders: 0 }
    expect(automationGuard(base)).toEqual({ send: true })
    expect(automationGuard({ ...base, paidOrders: 1 })).toEqual({ send: false, stop: 'compra_confirmada' })
    expect(automationGuard({ ...base, marketingConsent: false })).toEqual({ send: false, stop: 'sin_consentimiento' })
    expect(automationGuard({ ...base, enabled: false })).toEqual({ send: false, stop: null })
  })

  it('el recordatorio de pedido no se envía si el pago ya fue registrado', () => {
    const base = { automationKey: 'pedido_pendiente', enabled: true, requiresMarketingConsent: false, marketingConsent: false, paidOrders: 0 }
    expect(automationGuard({ ...base, orderPaymentStatus: 'pendiente' })).toEqual({ send: true })
    expect(automationGuard({ ...base, orderPaymentStatus: 'en_verificacion' })).toEqual({ send: false, stop: 'pago_registrado' })
  })
})
