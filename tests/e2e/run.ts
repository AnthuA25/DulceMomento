import { execSync, spawn } from 'node:child_process'
import { chromium, type Browser } from 'playwright-core'

const SITE = 'http://localhost:4174'
const outDir = '.e2e-dist'
const results: { name: string; ok: boolean }[] = []

function check(name: string, ok: boolean, detail = '') {
  results.push({ name, ok })
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${ok || !detail ? '' : ` — ${detail}`}`)
}

async function main() {
  console.log('Compilando una versión de prueba aislada (sin conectar al proyecto Firebase)…')
  execSync(`npx vite build --outDir ${outDir} --logLevel error`, {
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_FIREBASE_API_KEY: '',
      VITE_FIREBASE_AUTH_DOMAIN: '',
      VITE_FIREBASE_PROJECT_ID: '',
      VITE_FIREBASE_STORAGE_BUCKET: '',
      VITE_FIREBASE_APP_ID: '',
      VITE_GA_MEASUREMENT_ID: '',
      VITE_SITE_URL: SITE,
    },
  })

  const server = spawn(`npx vite preview --outDir ${outDir} --port 4174 --strictPort`, {
    shell: true,
    stdio: 'ignore',
  })
  let browser: Browser | undefined
  try {
    for (let attempt = 0; attempt < 40; attempt++) {
      try {
        if ((await fetch(SITE)).ok) break
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 250))
      }
    }

    for (const channel of ['msedge', 'chrome']) {
      try {
        browser = await chromium.launch({ channel })
        break
      } catch { /* probar el siguiente navegador */ }
    }
    if (!browser) throw new Error('No se encontró Microsoft Edge ni Google Chrome.')

    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const consoleErrors: string[] = []
    page.on('pageerror', (error) => consoleErrors.push(error.message))
    for (const path of ['/', '/productos', '/productos/keke-de-chocolate', '/kekes-personalizados', '/contacto']) {
      await page.goto(`${SITE}${path}`, { waitUntil: 'networkidle' })
      const seo = await page.evaluate(() => ({
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
        h1: document.querySelectorAll('h1').length,
        widthFits: document.documentElement.scrollWidth <= window.innerWidth + 1,
      }))
      check(`SEO y responsive ${path}`, Boolean(seo.title && seo.description && seo.h1 === 1 && seo.widthFits), JSON.stringify(seo))
    }

    await page.goto(`${SITE}/checkout`, { waitUntil: 'networkidle' })
    check('checkout anónimo redirige a la cuenta', new URL(page.url()).pathname.endsWith('/cuenta'))
    await page.getByRole('button', { name: 'Regístrate' }).click()
    check('registro se mantiene desactivado sin configuración Firebase', await page.getByRole('button', { name: 'Crear cuenta' }).isDisabled())
    await page.goto(`${SITE}/admin/login`, { waitUntil: 'networkidle' })
    check('acceso admin se mantiene desactivado sin configuración Firebase', await page.getByRole('button', { name: 'Ingresar' }).isDisabled())
    check('sin errores de ejecución', consoleErrors.length === 0)
  } finally {
    await browser?.close()
    server.kill()
  }

  const failed = results.filter((result) => !result.ok)
  console.log(`\n${results.length - failed.length} de ${results.length} comprobaciones correctas.`)
  if (failed.length) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
