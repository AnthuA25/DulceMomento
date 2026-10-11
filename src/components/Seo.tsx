import { SITE_URL } from '@/data/site'
import { publicAsset } from '@/utils/assets'

interface SeoProps {
  title: string
  description: string
  /** Ruta canónica, p. ej. "/productos". */
  path: string
  image?: string
  type?: 'website' | 'product'
  noindex?: boolean
  /** Datos estructurados JSON-LD. Solo deben describir contenido visible en la página. */
  jsonLd?: object | object[]
}

/**
 * Metadatos por página. React 19 mueve <title>, <meta> y <link> al <head>.
 */
export function Seo({ title, description, path, image = publicAsset('/img/hero.jpg'), type = 'website', noindex, jsonLd }: SeoProps) {
  const url = `${SITE_URL}${path === '/' ? '' : path}` || SITE_URL
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      {!noindex && <link rel="canonical" href={url} />}
      <meta property="og:site_name" content="Dulce Momento" />
      <meta property="og:locale" content="es_PE" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={`${SITE_URL}${image}`} />
      <meta name="twitter:card" content="summary_large_image" />
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block).replace(/</g, '\\u003c') }}
        />
      ))}
    </>
  )
}
