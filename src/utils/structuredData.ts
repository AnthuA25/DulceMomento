import { faqData, type FaqItem } from '../data/faq.ts'
import { SITE_URL } from '../data/site.ts'
import type { Product, PublicSettings } from '../types/index.ts'

// JSON-LD. Solo se declaran datos reales y visibles: sin valoraciones, sin
// horarios ni direcciones que el negocio no haya publicado.

export function businessSchema(s: PublicSettings) {
  const sameAs = [s.instagram_url, s.facebook_url, s.tiktok_url].filter(Boolean)
  const phone = (s.whatsapp_number ?? '').replace(/\D/g, '')
  return {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    name: s.business_name,
    url: SITE_URL,
    image: `${SITE_URL}/img/hero.jpg`,
    description: s.seo_description,
    priceRange: 'S/ 50',
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'San Isidro, Lima' },
      { '@type': 'City', name: 'Lima' },
    ],
    ...(phone ? { telephone: `+${phone}` } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  }
}

export function productSchema(p: Product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    image: `${SITE_URL}${p.image}`,
    category: p.categoryLabel,
    brand: { '@type': 'Brand', name: 'Dulce Momento' },
    ...(p.price !== null
      ? {
          offers: {
            '@type': 'Offer',
            url: `${SITE_URL}/productos/${p.slug}`,
            price: p.price.toFixed(2),
            priceCurrency: 'PEN',
            availability: p.active ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
        }
      : {}),
  }
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path === '/' ? '' : item.path}`,
    })),
  }
}

/** FAQPage: usar únicamente en páginas donde estas preguntas se muestran. */
export function faqSchema(items: FaqItem[] = faqData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: `${f.answer} ${f.detail}` },
    })),
  }
}
