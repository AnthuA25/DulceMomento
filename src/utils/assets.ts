/** Builds a public asset URL that works at both the domain root and a GitHub Pages project path. */
export function publicAsset(path: string): string {
  const base = typeof import.meta.env !== 'undefined' && import.meta.env.BASE_URL ? import.meta.env.BASE_URL : '/'
  return `${base}${path.replace(/^\/+/, '')}`
}
