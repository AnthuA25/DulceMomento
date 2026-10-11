import DOMPurify from 'dompurify'

// Limpieza del HTML del editor en el navegador (protección XSS). El backend vuelve
// a sanear con su propia lista blanca antes de guardar o enviar.
const CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'blockquote', 'hr', 'div', 'span'],
  ALLOWED_ATTR: ['href', 'data-cta'],
  ALLOW_DATA_ATTR: false,
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\{\{site_url\}\})/i,
}

export const sanitizeHtml = (html: string): string => DOMPurify.sanitize(html, CONFIG)
