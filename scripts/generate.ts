// Genera, a partir del catálogo central (src/data/catalog.ts):
//   public/sitemap.xml · public/robots.txt · supabase/seed.sql
// Se ejecuta antes de cada build (npm run generate).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { activeProducts, products } from '../src/data/catalog.ts'

function siteUrl(): string {
  if (process.env.VITE_SITE_URL) return process.env.VITE_SITE_URL
  for (const file of ['.env.local', '.env']) {
    try {
      const match = /^VITE_SITE_URL=(.+)$/m.exec(readFileSync(file, 'utf8'))
      if (match) return match[1].trim()
    } catch { /* el archivo es opcional */ }
  }
  return 'http://localhost:5173'
}
const SITE = siteUrl().replace(/\/$/, '')

// Solo páginas públicas indexables. Nunca /admin, carrito ni checkout.
const paths = ['/', '/productos', '/kekes-personalizados', '/contacto', ...activeProducts.map((p) => `/productos/${p.slug}`)]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${SITE}${p}</loc></url>`).join('\n')}
</urlset>
`

const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /carrito
Disallow: /checkout
Disallow: /gracias
Disallow: /pedido-confirmado
Disallow: /baja

Sitemap: ${SITE}/sitemap.xml
`

const q = (v: string | null) => (v === null ? 'null' : `'${v.replace(/'/g, "''")}'`)
const seed = `-- Generado por \`npm run generate\` desde src/data/catalog.ts. No editar a mano.
insert into public.products
  (id, slug, name, category, description, price, portions, lead_time, flavors, customizable, personalization_fields, image, active, sort_order)
values
${products.map((p, i) => `  (${[
    q(p.id), q(p.slug), q(p.name), q(p.category), q(p.description), p.price ?? 'null', q(p.portions), q(p.leadTime),
    `${q(JSON.stringify(p.flavors))}::jsonb`, p.customizable, `${q(JSON.stringify(p.personalizationFields))}::jsonb`,
    q(p.image), p.active, i,
  ].join(', ')})`).join(',\n')}
on conflict (id) do update set
  slug = excluded.slug, name = excluded.name, category = excluded.category, description = excluded.description,
  price = excluded.price, portions = excluded.portions, lead_time = excluded.lead_time, flavors = excluded.flavors,
  customizable = excluded.customizable, personalization_fields = excluded.personalization_fields,
  image = excluded.image, active = excluded.active, sort_order = excluded.sort_order, updated_at = now();
`

mkdirSync('public', { recursive: true })
writeFileSync('public/sitemap.xml', sitemap)
writeFileSync('public/robots.txt', robots)
writeFileSync('supabase/seed.sql', seed)
console.log(`Generado: sitemap (${paths.length} URLs), robots.txt y seed.sql (${products.length} productos) para ${SITE}`)
