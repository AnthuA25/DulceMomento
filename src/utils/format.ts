export const formatPrice = (value: number) =>
  `S/ ${Number.isInteger(value) ? value : value.toFixed(2)}`

export const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export const formatDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

/** Fecha mínima seleccionable en formularios (hoy, en formato yyyy-mm-dd local). */
export function todayIso(): string {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

/** Exporta filas a CSV (con BOM para que Excel respete las tildes) y lo descarga. */
export function downloadCsv(filename: string, headers: string[], rows: (string | number | null)[][]) {
  const escape = (v: string | number | null) => {
    let s = String(v ?? '')
    // Evita que Excel interprete el valor como fórmula.
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
    return `"${s.replace(/"/g, '""')}"`
  }
  const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
