// Pruebas de extremo a extremo: el sitio compilado, en un navegador real, contra el
// backend local de pruebas (migración SQL real en memoria).   npm run test:e2e
// Requiere Microsoft Edge o Google Chrome instalado. Usa DATOS DEMOSTRATIVOS.
import { execSync, spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium, type Browser, type ConsoleMessage, type Dialog, type Page } from 'playwright-core'
import { createBackend } from './backend.ts'

const API = 'http://127.0.0.1:54399'
const SITE = 'http://localhost:4174'
const SHOTS = process.env.E2E_SHOTS ?? '.e2e-dist/capturas'
const results: { name: string; ok: boolean; detail?: string }[] = []

function check(name: string, ok: boolean, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${ok || !detail ? '' : ` — ${detail}`}`)
}
const eq = (name: string, actual: unknown, expected: unknown) =>
  check(name, JSON.stringify(actual) === JSON.stringify(expected), `esperado ${JSON.stringify(expected)}, obtenido ${JSON.stringify(actual)}`)

async function main() {
  console.log('Compilando el sitio para pruebas…')
  execSync('npx vite build --outDir .e2e-dist --logLevel error', {
    stdio: 'inherit',
    env: { ...process.env, VITE_SUPABASE_URL: API, VITE_SUPABASE_ANON_KEY: 'clave-anonima-de-pruebas', VITE_ADMIN_EMAIL_DOMAIN: 'ejemplo.com', VITE_SITE_URL: SITE },
  })
  mkdirSync(SHOTS, { recursive: true })
  const server = spawn('npx vite preview --outDir .e2e-dist --port 4174 --strictPort', { shell: true, stdio: 'ignore' })
  const backend = await createBackend()
  const one = async (sql: string, params: unknown[] = []) => (await backend.db.query<any>(sql, params)).rows[0]

  let browser: Browser | undefined
  for (const channel of ['msedge', 'chrome']) {
    try { browser = await chromium.launch({ channel }); break } catch { /* probar el siguiente */ }
  }
  if (!browser) throw new Error('No se encontró Microsoft Edge ni Google Chrome.')

  const problems: string[] = []
  async function newPage(viewport: { width: number; height: number }, mobile = false) {
    const context = await browser!.newContext({ viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 })
    await context.route(`${API}/**`, async (route) => {
      const req = route.request()
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
      const reply = await backend.handle(req.method(), req.url(), req.headers(), req.postData())
      await route.fulfill({ status: reply.status, headers: { ...cors, 'content-type': 'application/json' }, body: reply.body === null ? '' : JSON.stringify(reply.body) })
    })
    await context.route('https://fonts.g*/**', (route) => route.abort())
    const page = await context.newPage()
    page.on('console', (m: ConsoleMessage) => m.type() === 'error' && !/fonts\.g|ERR_FAILED/.test(m.text()) && problems.push(`consola: ${m.text()}`))
    page.on('pageerror', (e: Error) => problems.push(`error: ${e.message}`))
    return page
  }
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
  const shot = (page: Page, name: string, fullPage = true) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage })
  const noOverflow = async (page: Page, name: string) =>
    check(`${name}: sin desplazamiento horizontal`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1))

  try {
    // Espera a que el servidor de vista previa responda.
    for (let i = 0; i < 40; i++) {
      try { if ((await fetch(SITE)).ok) break } catch { await new Promise((r) => setTimeout(r, 250)) }
    }

    // ------------------------------------------------------------------
    console.log('\nPRUEBA 10 · Responsive y PRUEBA 9 · SEO')
    for (const [name, viewport, mobile] of [['movil', { width: 390, height: 844 }, true], ['tablet', { width: 820, height: 1180 }, true], ['desktop', { width: 1440, height: 900 }, false]] as const) {
      const page = await newPage(viewport, mobile)
      for (const path of ['/', '/productos', '/productos/keke-de-chocolate', '/kekes-personalizados', '/contacto']) {
        await page.goto(SITE + path, { waitUntil: 'networkidle' })
        await noOverflow(page, `${name} ${path}`)
        if (name === 'desktop') {
          const seo = await page.evaluate(() => ({
            title: document.title,
            description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
            canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
            h1: document.querySelectorAll('h1').length,
            og: Boolean(document.querySelector('meta[property="og:title"]')),
            missingAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).length,
            jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent!)['@type']),
          }))
          check(`SEO ${path}: title, description, canonical, 1 H1, OG y alt`,
            seo.title.includes('Dulce Momento') && seo.description.length > 60 && seo.canonical.startsWith(SITE) && seo.h1 === 1 && seo.og && seo.missingAlt === 0,
            JSON.stringify(seo))
          if (path === '/productos/keke-de-chocolate') eq('JSON-LD de producto', seo.jsonLd, ['Product', 'BreadcrumbList'])
          if (path === '/kekes-personalizados') eq('title de la página SEO', seo.title, 'Kekes Personalizados en Lima | Dulce Momento')
        }
      }
      await page.goto(SITE, { waitUntil: 'networkidle' })
      await shot(page, `home-${name}`)
      if (name === 'movil') {
        await page.getByRole('button', { name: 'Abrir menú' }).click()
        check('móvil: el menú se abre y anuncia su estado', await page.getByRole('button', { name: 'Cerrar menú' }).getAttribute('aria-expanded') === 'true')
        await shot(page, 'menu-movil', false)
      }
      await page.context().close()
    }
    for (const file of ['/robots.txt', '/sitemap.xml']) check(`${file} disponible`, (await fetch(SITE + file)).ok)

    // ------------------------------------------------------------------
    console.log('\nPRUEBAS 1 y 2 · Formulario → contacto, consulta y recurrencia')
    const page = await newPage({ width: 1440, height: 900 })
    await page.goto(`${SITE}/contacto`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Enviar consulta' }).click()
    check('validación: muestra errores claros y no envía', (await page.getByRole('alert').count()) >= 4 && page.url().endsWith('/contacto'))
    check('casilla de marketing desmarcada por defecto', !(await page.locator('#c-marketing').isChecked()))
    await shot(page, 'formulario-errores')

    async function fillForm(type: string, consent: boolean) {
      await page.goto(`${SITE}/contacto`, { waitUntil: 'networkidle' })
      await page.locator('#c-first_name').fill('María')
      await page.locator('#c-last_name').fill('López (demostrativo)')
      await page.locator('#c-phone').fill('999 000 111')
      await page.locator('#c-email').fill('maria.demo@ejemplo.com')
      await page.locator('#c-inquiry_type').selectOption(type)
      await page.locator('#c-product_id').selectOption('keke-de-chocolate')
      await page.locator('#c-message').fill('Consulta demostrativa de prueba.')
      if (consent) await page.locator('#c-marketing').check()
      await page.getByRole('button', { name: 'Enviar consulta' }).click()
      await page.getByRole('heading', { name: '¡Gracias por contactarnos!' }).waitFor()
      return (await page.locator('dd').first().textContent()) ?? ''
    }
    const code1 = await fillForm('cotizacion', false)
    check('página de agradecimiento con código DM-XXXXXX', /^DM-\d{6}$/.test(code1), code1)
    check('no afirma haber enviado un correo que no se envió', (await page.getByText('También enviamos una confirmación').count()) === 0)
    await shot(page, 'gracias')
    const code2 = await fillForm('delivery', false)
    check('la segunda consulta genera un código distinto', code2 !== code1 && /^DM-\d{6}$/.test(code2))
    const maria = await one(`select * from contact_directory where email = 'maria.demo@ejemplo.com'`)
    eq('mismo correo: 1 contacto, 2 consultas, Recurrente', [(await one(`select count(*)::int n from contacts`)).n, maria.inquiries_count, maria.customer_type], [1, 2, 'recurrente'])
    eq('PRUEBA 3 · sin aceptar marketing: no elegible', maria.marketing_consent, false)

    console.log('\nDulce Bot → mismo CRM')
    await page.goto(SITE, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: '¿Necesitas ayuda?' }).click()
    await page.getByRole('button', { name: 'Delivery', exact: true }).click()
    check('el bot responde con la misma respuesta de la FAQ', (await page.getByRole('log').getByText('Nuestra zona principal es San Isidro').count()) === 1)
    await page.getByRole('button', { name: 'Hacer pedido' }).click()
    const lead = page.getByRole('form', { name: 'Dejar mis datos' })
    await lead.locator('#b-name').fill('Ana Bot (demostrativo)')
    await lead.locator('#b-email').fill('ana.bot@ejemplo.com')
    await lead.locator('#b-phone').fill('988777666')
    await lead.locator('#b-marketing').check()
    await shot(page, 'dulce-bot', false)
    await lead.getByRole('button', { name: 'Enviar mis datos' }).click()
    await page.getByRole('log').getByText(/Registramos tu consulta con el código DM-/).waitFor()
    const ana = await one(`select c.marketing_consent, i.source from contacts c join inquiries i on i.contact_id = c.id where c.email = 'ana.bot@ejemplo.com'`)
    eq('PRUEBA 4 · lead del chatbot con consentimiento', ana, { marketing_consent: true, source: 'chatbot' })

    // ------------------------------------------------------------------
    console.log('\nPRUEBA 6 · Carrito')
    await page.goto(`${SITE}/productos/keke-de-cumpleanos`, { waitUntil: 'networkidle' })
    await page.getByText('Vainilla', { exact: true }).click()
    await page.getByRole('button', { name: 'Personalizar' }).click()
    await page.locator('#opt-dedicatoria').fill('Feliz cumpleaños')
    await page.locator('#opt-empaque_regalo').check()
    await page.getByRole('button', { name: 'Aumentar cantidad' }).click()
    await page.getByRole('button', { name: 'Agregar al carrito' }).click()
    await page.goto(`${SITE}/productos`, { waitUntil: 'networkidle' })
    await page.locator('article', { hasText: 'Keke para reuniones' }).getByRole('button', { name: 'Al carrito' }).click()
    await page.goto(`${SITE}/carrito`, { waitUntil: 'networkidle' })
    const total = () => page.locator('#resumen-titulo ~ dl dd').last().innerText()
    check('agrega 2 líneas y calcula el total (2×50 + 50)', (await total()).startsWith('S/ 150'), await total())
    check('conserva la personalización elegida', (await page.getByText('Feliz cumpleaños').count()) > 0 && (await page.getByText('Vainilla').count()) > 0)
    await shot(page, 'carrito')
    await page.getByRole('group', { name: 'Cantidad de Keke para reuniones' }).getByRole('button', { name: 'Aumentar cantidad' }).click()
    check('modificar cantidad recalcula el total', (await total()).startsWith('S/ 200'), await total())
    await page.reload({ waitUntil: 'networkidle' })
    check('el carrito persiste al recargar', (await total()).startsWith('S/ 200'))
    await page.getByRole('button', { name: 'Eliminar Keke para reuniones' }).click()
    check('eliminar un producto recalcula el total', (await total()).startsWith('S/ 100'), await total())

    console.log('\nPRUEBA 7 · Checkout')
    await page.getByRole('link', { name: 'Ir al checkout' }).click()
    await page.waitForURL('**/checkout')
    await page.getByRole('button', { name: 'Registrar pedido' }).click()
    check('checkout: valida los campos obligatorios', (await page.getByRole('alert').count()) >= 6)
    await page.locator('#k-first_name').fill('Carla')
    await page.locator('#k-last_name').fill('Ríos (demostrativo)')
    await page.locator('#k-email').fill('carla.demo@ejemplo.com')
    await page.locator('#k-phone').fill('977 111 222')
    await page.locator('#k-zone').selectOption('San Isidro')
    await page.locator('#k-address').fill('Av. Demostrativa 123')
    await page.locator('#k-requested_date').fill(new Date(Date.now() + 6 * 86_400_000).toISOString().slice(0, 10))
    await page.getByText('Yape', { exact: true }).click()
    check('no inventa datos de pago: avisa que se envían por WhatsApp', (await page.getByText('Te enviaremos los datos de Yape por WhatsApp').count()) === 1)
    await shot(page, 'checkout')
    await page.getByRole('button', { name: 'Registrar pedido' }).click()
    await page.getByRole('heading', { name: '¡Registramos tu pedido!' }).waitFor()
    const orderCode = (await page.locator('dd').first().textContent()) ?? ''
    check('pedido registrado con código DMP-XXXXXX', /^DMP-\d{6}$/.test(orderCode), orderCode)
    await shot(page, 'pedido-confirmado')
    const order = await one(`select o.total, o.delivery_fee, p.status, (select count(*)::int from order_items where order_id = o.id) items,
      (select options from order_items where order_id = o.id) options from orders o join payments p on p.order_id = o.id where o.order_code = $1`, [orderCode])
    eq('pedido en la base: total, pago pendiente y personalización', [Number(order.total), order.delivery_fee, order.status, order.items, order.options],
      [100, null, 'pendiente', 1, { sabor: 'Vainilla', dedicatoria: 'Feliz cumpleaños', empaque_regalo: true }])
    await page.goto(`${SITE}/carrito`, { waitUntil: 'networkidle' })
    check('el carrito queda vacío después de comprar', (await page.getByText('Tu carrito está vacío.').count()) === 1)

    // ------------------------------------------------------------------
    console.log('\nPRUEBA 8 · Acceso al panel administrativo')
    for (const path of ['/admin', '/admin/inicio', '/admin/contactos', '/admin/email-marketing', '/admin/configuracion']) {
      await page.goto(SITE + path, { waitUntil: 'networkidle' })
      check(`sin sesión, ${path} redirige al login`, page.url().endsWith('/admin/login') && (await page.getByText('Directorio de contactos').count()) === 0)
    }
    check('el login lleva noindex, nofollow', (await page.locator('meta[name="robots"]').getAttribute('content')) === 'noindex, nofollow')
    const anonRead = await backend.handle('GET', `${API}/rest/v1/contacts?select=*`, { authorization: 'Bearer clave-anonima-de-pruebas' }, null)
    eq('la API rechaza leer contactos sin sesión de administrador', anonRead.status, 403)
    check('el sitio público no enlaza a /admin', (await (await fetch(SITE)).text()).includes('/admin') === false)

    await page.locator('#l-user').fill('admin')
    const before = problems.length
    await page.locator('#l-password').fill('contraseña-incorrecta')
    await page.getByRole('button', { name: 'Ingresar' }).click()
    await page.getByText('Usuario o contraseña incorrectos.').waitFor()
    problems.length = before // el 400 del intento fallido es el resultado esperado
    check('rechaza una contraseña incorrecta', page.url().endsWith('/admin/login'))
    await shot(page, 'admin-login', false)
    await page.locator('#l-password').fill(backend.admin.password)
    await page.getByRole('button', { name: 'Ingresar' }).click()
    await page.waitForURL('**/admin/configuracion')
    check('tras ingresar vuelve a la página solicitada', true)
    await page.goto(SITE + '/admin/inicio', { waitUntil: 'networkidle' })

    console.log('\nPanel: dashboard, CRM, pedidos, email marketing')
    await page.getByText('Directorio de contactos').waitFor()
    await page.locator('table tbody tr').first().waitFor()
    const stats = await page.locator('.card p.font-display').allInnerTexts()
    eq('dashboard: contactos, nuevos, recurrentes y consultas calculados desde la base', stats.slice(0, 4), ['3', '2', '1', '3'])
    await shot(page, 'admin-inicio')

    await page.locator('#d-search').fill('maria')
    eq('buscador del directorio', await page.locator('table tbody tr').count(), 1)
    await page.getByRole('link', { name: 'Ver detalle' }).first().click()
    await page.getByRole('heading', { name: 'Historial de consultas' }).waitFor()
    eq('detalle: historial con las 2 consultas', await page.locator('table tbody tr').count(), 2)
    await page.locator('#cd-note').fill('Nota demostrativa: prefiere contacto por la tarde.')
    await page.getByRole('button', { name: 'Guardar nota' }).click()
    await page.getByText('Nota demostrativa: prefiere contacto por la tarde.').waitFor()
    await page.getByLabel(`Estado de ${code2}`).selectOption('respondida')
    await page.waitForTimeout(400)
    eq('nota y estado guardados en la base', [(await one(`select count(*)::int n from crm_notes`)).n, (await one(`select status from inquiries where request_code = $1`, [code2])).status], [1, 'respondida'])
    const wa = (await page.getByRole('link', { name: 'Contactar por WhatsApp' }).getAttribute('href')) ?? ''
    check('WhatsApp del CRM: abre el chat con mensaje preparado (no envía solo)', wa.startsWith('https://wa.me/51999000111?text=') && decodeURIComponent(wa).includes('Hola María 👋 Te escribimos de Dulce Momento por la consulta que realizaste sobre Keke de chocolate'), wa)
    await shot(page, 'admin-contacto')

    await page.goto(`${SITE}/admin/pedidos`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Ver detalle' }).click()
    page.once('dialog', (d: Dialog) => d.accept())
    await page.getByRole('button', { name: 'Marcar como pagado' }).click()
    await page.getByText('Pago: Pagado').waitFor()
    eq('pago verificado por el admin → lifecycle Cliente', (await one(`select lifecycle_stage from contacts where email = 'carla.demo@ejemplo.com'`)).lifecycle_stage, 'cliente')
    await shot(page, 'admin-pedidos')

    console.log('\nPRUEBA 5 · Campaña comercial excluye a quien no dio consentimiento')
    await page.goto(`${SITE}/admin/email-marketing`, { waitUntil: 'networkidle' })
    await page.locator('#em-name').fill('Campaña demostrativa')
    await page.locator('#em-subject').fill('Hola {{nombre}}, novedades de Dulce Momento')
    const editor = page.getByRole('textbox', { name: 'Contenido del mensaje' })
    await editor.click()
    await page.keyboard.type('Hola {{nombre}}, tenemos kekes artesanales por pedido.')
    await page.getByRole('tab', { name: 'Ver HTML' }).click()
    await page.locator('#em-html').fill('<h2>Hola {{nombre}}</h2><p>Kekes por pedido.</p><script>alert(1)</script><img src=x onerror=alert(1)>')
    await page.getByRole('tab', { name: 'Editor visual' }).click()
    const editorHtml = await editor.innerHTML()
    check('el editor elimina scripts y HTML peligroso', !/script|onerror|<img/i.test(editorHtml) && editorHtml.includes('<h2>'), editorHtml)
    await page.getByRole('button', { name: /^Todos los contactos/ }).click()
    eq('comercial + "Todos los contactos" = solo quienes aceptaron marketing', await page.getByText(/^SELECCIONADOS:/).innerText(), 'SELECCIONADOS: 1')
    check('los contactos sin consentimiento no se pueden seleccionar', await page.getByRole('checkbox', { name: /maria\.demo@ejemplo\.com/ }).isDisabled())
    await shot(page, 'admin-email-marketing')
    await page.getByRole('button', { name: 'Previsualizar correo' }).click()
    const frame = page.frameLocator('iframe[title="Vista previa del correo"]')
    await frame.getByText('Hola María (dato demostrativo)').waitFor()
    check('vista previa: variables con datos demostrativos y enlace de baja', (await frame.getByText('Dejar de recibir novedades').count()) === 1)
    await page.getByRole('button', { name: 'Móvil' }).click()
    await shot(page, 'admin-email-preview', false)
    await page.getByRole('button', { name: 'Cerrar' }).click()
    await page.getByText('Operativa', { exact: true }).click()
    await page.getByRole('button', { name: /^Todos los contactos/ }).click()
    eq('operativa: contactos con consulta o pedido', await page.getByText(/^SELECCIONADOS:/).innerText(), 'SELECCIONADOS: 3')
    eq('previsualizar no registra envíos', (await one(`select count(*)::int n from email_events`)).n, 0)

    for (const [path, text] of [['/admin/email-marketing/campanas', 'Historial de campañas'], ['/admin/automatizaciones', 'Bienvenida y conversión de leads'], ['/admin/configuracion', 'Cambiar contraseña']] as const) {
      await page.goto(SITE + path, { waitUntil: 'networkidle' })
      await page.getByText(text).first().waitFor()
      await noOverflow(page, path)
      await shot(page, `admin-${path.split('/').pop()}`)
    }
    await page.locator('#s-whatsapp_number').fill('51 900 000 000')
    await page.getByRole('button', { name: 'Guardar configuración' }).click()
    await page.getByText('Configuración guardada.', { exact: false }).waitFor()
    eq('configuración: guarda el WhatsApp normalizado', (await one(`select value from site_settings where key = 'whatsapp_number'`)).value, '51900000000')
    await page.goto(SITE, { waitUntil: 'networkidle' })
    check('el sitio público usa el WhatsApp configurado', ((await page.getByRole('link', { name: 'Pedir por WhatsApp' }).first().getAttribute('href')) ?? '').startsWith('https://wa.me/51900000000?'))

    const mobile = await newPage({ width: 390, height: 844 }, true)
    await mobile.goto(`${SITE}/admin/login`, { waitUntil: 'networkidle' })
    await mobile.locator('#l-user').fill('admin')
    await mobile.locator('#l-password').fill(backend.admin.password)
    await mobile.getByRole('button', { name: 'Ingresar' }).click()
    await mobile.getByText('Directorio de contactos').waitFor()
    await mobile.locator('ul.md\\:hidden li').first().waitFor()
    await noOverflow(mobile, 'móvil /admin/inicio')
    await shot(mobile, 'admin-inicio-movil')

    check('sin errores en la consola del navegador', problems.length === 0, problems.slice(0, 5).join(' | '))
  } finally {
    await browser.close()
    server.kill()
    if (process.platform === 'win32') try { execSync('for /f "tokens=5" %a in (\'netstat -ano ^| findstr :4174 ^| findstr LISTENING\') do taskkill /F /PID %a', { stdio: 'ignore' }) } catch { /* ya cerrado */ }
  }

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length} de ${results.length} comprobaciones correctas. Capturas en ${SHOTS}`)
  process.exit(failed.length ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
