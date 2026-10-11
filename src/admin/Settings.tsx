import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { PENDING } from '@/data/site'
import { useAsync } from '@/hooks/useAsync'
import { getAllSettings, saveSettings } from '@/services/admin'
import type { DeliveryZone } from '@/types'
import { AdminMeta } from './AdminLayout'
import { PageHeader, Status } from './components/ui'

// Campos de texto simples: [clave, etiqueta, ayuda, tipo]
type FieldDef = [key: string, label: string, help?: string, type?: string]

const groups: { title: string; note?: string; fields: FieldDef[] }[] = [
  {
    title: 'Negocio y contacto',
    fields: [
      ['business_name', 'Nombre del negocio'],
      ['whatsapp_number', 'WhatsApp', 'Con código de país, solo números. Ej. 51 seguido del número.', 'tel'],
      ['instagram_url', 'Instagram (URL)', undefined, 'url'],
      ['facebook_url', 'Facebook (URL)', undefined, 'url'],
      ['tiktok_url', 'TikTok (URL)', undefined, 'url'],
    ],
  },
  {
    title: 'Email',
    note: 'La API key del proveedor no se guarda aquí: vive en los secrets del servidor.',
    fields: [
      ['sender_name', 'Nombre del remitente'],
      ['sender_email', 'Email remitente', 'Debe pertenecer a un dominio verificado en el proveedor de email.', 'email'],
      ['admin_email', 'Email administrativo', 'Recibe las notificaciones de nuevas consultas y pedidos.', 'email'],
    ],
  },
  {
    title: 'Yape',
    note: 'Se muestra al cliente en el checkout. Si queda vacío, se le indica que los datos se envían por WhatsApp.',
    fields: [['payment_yape.number', 'Número de Yape', undefined, 'tel'], ['payment_yape.holder', 'Titular']],
  },
  { title: 'Plin', fields: [['payment_plin.number', 'Número de Plin', undefined, 'tel'], ['payment_plin.holder', 'Titular']] },
  {
    title: 'Transferencia bancaria',
    fields: [
      ['payment_transfer.bank', 'Banco'], ['payment_transfer.holder', 'Titular'],
      ['payment_transfer.account', 'Número de cuenta'], ['payment_transfer.cci', 'CCI'],
    ],
  },
  {
    title: 'SEO',
    fields: [['seo_title', 'Título de la página de inicio'], ['seo_description', 'Meta descripción de la página de inicio']],
  },
]

const read = (values: Record<string, unknown>, path: string): string => {
  const [key, sub] = path.split('.')
  const value = sub ? (values[key] as Record<string, unknown> | null)?.[sub] : values[key]
  return value === null || value === undefined ? '' : String(value)
}

function PasswordForm() {
  const { changePassword } = useAuth()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const password = String(data.get('password'))
    if (password.length < 8) return setMessage({ ok: false, text: 'Usa al menos 8 caracteres.' })
    if (password !== data.get('repeat')) return setMessage({ ok: false, text: 'Las contraseñas no coinciden.' })
    setBusy(true)
    try {
      await changePassword(password)
      form.reset()
      setMessage({ ok: true, text: 'Contraseña actualizada.' })
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-5 sm:p-6">
      <h2 className="text-xl">Cambiar contraseña</h2>
      <p className="mt-1 text-sm">La contraseña se guarda cifrada en el sistema de autenticación; nadie puede verla.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="pw-new" className="label">Nueva contraseña</label>
          <input id="pw-new" name="password" type="password" className="field" autoComplete="new-password" minLength={8} required /></div>
        <div><label htmlFor="pw-repeat" className="label">Repetir contraseña</label>
          <input id="pw-repeat" name="repeat" type="password" className="field" autoComplete="new-password" minLength={8} required /></div>
      </div>
      {message && <p role={message.ok ? 'status' : 'alert'} className={message.ok ? 'mt-3 text-sm font-semibold text-green-800' : 'field-error'}>{message.text}</p>}
      <button type="submit" className="btn-secondary btn-sm mt-4" disabled={busy}>Actualizar contraseña</button>
    </form>
  )
}

export default function Settings() {
  const { data, loading, error } = useAsync(getAllSettings)
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (data) setValues(data)
  }, [data])

  const write = (path: string, raw: string) => {
    const value = raw.trim() === '' ? null : raw
    const [key, sub] = path.split('.')
    setValues((v) => ({ ...v, [key]: sub ? { ...(v[key] as object), [sub]: value } : value }))
  }

  const zones = (values.delivery_zones as DeliveryZone[] | undefined) ?? []
  const setZones = (next: DeliveryZone[]) => setValues((v) => ({ ...v, delivery_zones: next }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      await saveSettings({
        ...values,
        whatsapp_number: read(values, 'whatsapp_number').replace(/\D/g, '') || null,
        business_name: read(values, 'business_name').trim() || 'Dulce Momento',
        sender_name: read(values, 'sender_name').trim() || 'Dulce Momento',
        delivery_zones: zones.filter((z) => z.name.trim()).map((z) => ({ name: z.name.trim(), fee: z.fee })),
        loyalty_min_orders: Math.max(3, Number(values.loyalty_min_orders) || 4),
      })
      setMessage({ ok: true, text: 'Configuración guardada. Los cambios públicos se ven al recargar el sitio.' })
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'No se pudo guardar.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <AdminMeta title="Configuración" />
      <PageHeader eyebrow="Parámetros del sitio" title="Configuración" />
      <Status loading={loading} error={error}>
        <form onSubmit={onSubmit} className="space-y-6">
          {groups.map((group) => (
            <fieldset key={group.title} className="card p-5 sm:p-6">
              <legend className="float-left w-full font-display text-xl font-semibold text-chocolate">{group.title}</legend>
              {group.note && <p className="clear-both pt-1 text-sm">{group.note}</p>}
              <div className="clear-both grid gap-4 pt-4 sm:grid-cols-2">
                {group.fields.map(([key, label, help, type = 'text']) => (
                  <div key={key}>
                    <label htmlFor={`s-${key}`} className="label">{label}</label>
                    <input id={`s-${key}`} type={type} className="field" placeholder={PENDING} value={read(values, key)}
                      onChange={(e) => write(key, e.target.value)} aria-describedby={help ? `s-${key}-help` : undefined} />
                    {help && <p id={`s-${key}-help`} className="mt-1 text-xs">{help}</p>}
                  </div>
                ))}
              </div>
            </fieldset>
          ))}

          <fieldset className="card p-5 sm:p-6">
            <legend className="float-left w-full font-display text-xl font-semibold text-chocolate">Delivery</legend>
            <p className="clear-both pt-1 text-sm">Distritos que aparecen en el checkout. Deja la tarifa vacía si se confirma con el cliente.</p>
            <ul className="mt-4 space-y-3">
              {zones.map((zone, i) => (
                <li key={i} className="grid grid-cols-[1fr_7rem_auto] items-end gap-3">
                  <div><label htmlFor={`z-name-${i}`} className="label">Distrito</label>
                    <input id={`z-name-${i}`} className="field" value={zone.name}
                      onChange={(e) => setZones(zones.map((z, n) => (n === i ? { ...z, name: e.target.value } : z)))} /></div>
                  <div><label htmlFor={`z-fee-${i}`} className="label">Tarifa (S/)</label>
                    <input id={`z-fee-${i}`} type="number" min={0} step="0.5" className="field" placeholder="—" value={zone.fee ?? ''}
                      onChange={(e) => setZones(zones.map((z, n) => (n === i ? { ...z, fee: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) } : z)))} /></div>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => setZones(zones.filter((_, n) => n !== i))}>
                    Quitar<span className="sr-only"> {zone.name}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="btn-ghost btn-sm mt-4" onClick={() => setZones([...zones, { name: '', fee: null }])}>Agregar distrito</button>
            <label className="mt-5 flex items-center gap-3 text-sm text-chocolate">
              <input type="checkbox" className="h-4 w-4 accent-terracota" checked={values.pickup_enabled === true}
                onChange={(e) => setValues((v) => ({ ...v, pickup_enabled: e.target.checked }))} />
              Ofrecer también recojo en el checkout
            </label>
          </fieldset>

          <fieldset className="card p-5 sm:p-6">
            <legend className="float-left w-full font-display text-xl font-semibold text-chocolate">Customer lifecycle</legend>
            <div className="clear-both max-w-xs pt-4">
              <label htmlFor="s-loyal" className="label">Compras para “Cliente fidelizado”</label>
              <input id="s-loyal" type="number" min={3} max={50} className="field" value={String(values.loyalty_min_orders ?? 4)}
                onChange={(e) => setValues((v) => ({ ...v, loyalty_min_orders: Number(e.target.value) }))} aria-describedby="s-loyal-help" />
              <p id="s-loyal-help" className="mt-1 text-xs">Número de pedidos con pago verificado a partir del cual un cliente recurrente se considera fidelizado.</p>
            </div>
          </fieldset>

          <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-4 rounded-full border border-arena bg-marfil px-4 py-2 shadow-card">
            <button type="submit" className="btn-primary btn-sm" disabled={busy}>{busy ? 'Guardando…' : 'Guardar configuración'}</button>
            {message && <p role={message.ok ? 'status' : 'alert'} className={`text-sm font-semibold ${message.ok ? 'text-green-800' : 'text-red-700'}`}>{message.text}</p>}
          </div>
        </form>
        <div className="mt-6"><PasswordForm /></div>
      </Status>
    </>
  )
}
