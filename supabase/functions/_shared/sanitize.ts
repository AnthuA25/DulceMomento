// Sanitizador por lista blanca para el HTML de campañas. Se ejecuta siempre en el
// backend antes de guardar o enviar, sin confiar en la limpieza hecha en el navegador.
// Reconstruye cada etiqueta desde cero: nunca conserva atributos que no estén permitidos.

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'blockquote', 'hr', 'div', 'span',
])
const VOID_TAGS = new Set(['br', 'hr'])
const DROP_WITH_CONTENT = /<(script|style|iframe|object|embed|svg|math|template|noscript|form|textarea|select|title|head)\b[\s\S]*?<\/\1\s*>/gi

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Devuelve la URL si es segura (http, https, mailto o variable {{site_url}}); si no, null. */
export function safeUrl(raw: string): string | null {
  const url = raw
    .replace(/&amp;/g, '&')
    .replace(/&#x?[0-9a-f]+;?/gi, '')
    // deno-lint-ignore no-control-regex
    .replace(/[\u0000- ]/g, '')
  if (/^(https?:\/\/|mailto:)/i.test(url) || url.startsWith('{{site_url}}')) return url
  return null
}

function readAttr(attrs: string, name: string): string | null {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i').exec(attrs)
  return m ? (m[1] ?? m[2] ?? m[3] ?? '') : null
}

export function sanitizeEmailHtml(input: string): string {
  let html = String(input ?? '').slice(0, 100_000)
  html = html.replace(/<!--[\s\S]*?-->/g, '').replace(DROP_WITH_CONTENT, '')

  let out = ''
  let last = 0
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/g
  let m: RegExpExecArray | null
  while ((m = tagRe.exec(html))) {
    out += html.slice(last, m.index).replace(/</g, '&lt;').replace(/>/g, '&gt;')
    last = m.index + m[0].length
    const tag = m[1].toLowerCase()
    if (!ALLOWED_TAGS.has(tag)) continue
    if (m[0].startsWith('</')) {
      if (!VOID_TAGS.has(tag)) out += `</${tag}>`
      continue
    }
    if (tag === 'a') {
      const href = safeUrl(readAttr(m[2], 'href') ?? '')
      const cta = readAttr(m[2], 'data-cta') !== null ? ' data-cta="1"' : ''
      out += href ? `<a href="${escapeHtml(href)}"${cta} target="_blank" rel="noopener noreferrer">` : '<a>'
    } else {
      out += `<${tag}>`
    }
  }
  out += html.slice(last).replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return out.trim()
}
