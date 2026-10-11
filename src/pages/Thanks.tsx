import { Check } from 'lucide-react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Seo } from '@/components/Seo'
import { inquiryTypeLabels } from '@/data/site'
import type { InquiryResult } from '@/types'

export function SuccessIcon() {
  return (
    <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-800">
      <Check className="h-8 w-8" aria-hidden="true" />
    </span>
  )
}

export function SummaryList({ rows }: { rows: [string, string | null | undefined][] }) {
  return (
    <dl className="mt-4 divide-y divide-arena text-left text-sm">
      {rows.filter(([, v]) => v).map(([label, value]) => (
        <div key={label} className="grid grid-cols-[7rem_1fr] gap-3 py-2.5">
          <dt>{label}</dt>
          <dd className="whitespace-pre-line break-words font-semibold text-chocolate">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Página de agradecimiento tras enviar el formulario. Los datos llegan del backend. */
export default function Thanks() {
  const result = useLocation().state as InquiryResult | null
  if (!result?.request_code) return <Navigate to="/contacto" replace />

  return (
    <section className="section">
      <Seo title="¡Gracias por contactarnos! | Dulce Momento" description="Hemos recibido tu consulta." path="/gracias" noindex />
      <div className="container-site max-w-2xl text-center">
        <SuccessIcon />
        <h1 className="mt-5 text-4xl">¡Gracias por contactarnos!</h1>
        <p className="mt-3 text-lg">Hemos recibido tu consulta. Nuestro equipo se pondrá en contacto contigo próximamente.</p>

        <div className="card mt-8 p-6">
          <h2 className="eyebrow text-left">Resumen de tu solicitud</h2>
          <SummaryList rows={[
            ['Código', result.request_code],
            ['Nombre', `${result.first_name} ${result.last_name}`.trim()],
            ['Correo', result.email],
            ['WhatsApp', result.phone],
            ['Tipo', inquiryTypeLabels[result.inquiry_type]],
            ['Producto', result.product_name],
            ['Mensaje', result.message],
          ]} />
        </div>

        {result.email_sent && (
          <p className="mt-5 text-sm" role="status">También enviamos una confirmación a <strong className="text-chocolate">{result.email}</strong>.</p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-secondary">Volver al inicio</Link>
          <Link to="/productos" className="btn-primary">Ver más kekes</Link>
        </div>
      </div>
    </section>
  )
}
