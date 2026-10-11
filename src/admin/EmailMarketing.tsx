import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import { track } from '@/lib/analytics'
import {
  getEmailConfig, listContacts, previewEmail, saveDraft, sendCampaign, sendTestEmail, type CampaignDraft, type SendResult,
} from '@/services/admin'
import type { CampaignKind } from '@/types'
import { sanitizeHtml } from '@/utils/sanitize'
import { isEligible, segments } from '@/utils/segments'
import { AdminMeta } from './AdminLayout'
import { EmailEditor } from './components/EmailEditor'
import { RecipientPicker } from './components/RecipientPicker'
import { Modal, PageHeader, Status } from './components/ui'

const emptyDraft: CampaignDraft = { name: '', subject: '', sender_name: 'Dulce Momento', kind: 'comercial', html: '', segment: 'manual' }
type Dialog = null | 'preview' | 'test' | 'confirm'

export default function EmailMarketing() {
  const contacts = useAsync(listContacts)
  const config = useAsync(getEmailConfig)
  const [draft, setDraft] = useState(emptyDraft)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [scheduledAt, setScheduledAt] = useState('')
  const [dialog, setDialog] = useState<Dialog>(null)
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null)
  const [device, setDevice] = useState<'desktop' | 'movil'>('desktop')
  const [testTo, setTestTo] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [result, setResult] = useState<SendResult | null>(null)

  const set = <K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  // Al cambiar el tipo de comunicación se retira a quien ya no puede recibirla.
  const changeKind = (kind: CampaignKind) => {
    set('kind', kind)
    setSelected((current) => new Set((contacts.data ?? []).filter((c) => current.has(c.id) && isEligible(kind, c)).map((c) => c.id)))
  }

  useEffect(() => {
    if (config.data?.sender_name) setDraft((d) => ({ ...d, sender_name: d.sender_name || config.data!.sender_name }))
    if (config.data?.test_recipients[0]) setTestTo(config.data.test_recipients[0])
  }, [config.data])

  const clean = () => ({ ...draft, html: sanitizeHtml(draft.html) })
  const missing = !draft.name.trim() ? 'Escribe el nombre interno de la campaña.'
    : !draft.subject.trim() ? 'Escribe el asunto.'
    : !sanitizeHtml(draft.html).replace(/<[^>]+>/g, '').trim() ? 'Escribe el contenido del mensaje.' : ''

  const guard = async (action: () => Promise<void>, needsContent = true) => {
    setError('')
    setNotice('')
    if (needsContent && missing) return setError(missing)
    setBusy(true)
    try {
      await action()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar la acción.')
    } finally {
      setBusy(false)
    }
  }

  const openPreview = () => guard(async () => {
    setPreview(await previewEmail(clean()))
    setDialog('preview')
  })
  const sendTest = () => guard(async () => {
    await sendTestEmail(clean(), testTo)
    setDialog(null)
    setNotice(`Enviamos la prueba a ${testTo}. No se registró como campaña.`)
  })
  const storeDraft = () => guard(async () => {
    await saveDraft(clean())
    setNotice('Borrador guardado en el historial de campañas.')
  })
  const confirmSend = () => guard(async () => {
    const res = await sendCampaign(clean(), [...selected], scheduledAt ? new Date(scheduledAt).toISOString() : null)
    track('email_campaign_sent', { kind: draft.kind, recipients: res.recipients })
    setResult(res)
    setDialog(null)
    setDraft(emptyDraft)
    setSelected(new Set())
    setScheduledAt('')
  })

  const segmentLabel = segments.find((s) => s.id === draft.segment)?.label ?? 'Selección manual'
  const scheduled = Boolean(scheduledAt) && new Date(scheduledAt).getTime() > Date.now()

  return (
    <>
      <AdminMeta title="Email marketing" />
      <PageHeader eyebrow="Módulo de email marketing" title="Crear y Enviar Campaña de Correo">
        <Link to="/admin/email-marketing/campanas" className="btn-ghost btn-sm">Historial de campañas</Link>
      </PageHeader>

      {config.data && !config.data.configured && (
        <p className="notice mb-5" role="status">
          El servicio de email todavía no está configurado (falta la API key o el correo remitente). Puedes preparar y
          previsualizar campañas, pero no se enviarán correos hasta completar la configuración indicada en el README.
        </p>
      )}
      {result && (
        <div className="notice mb-5 !border-green-300 !bg-green-50" role="status">
          <p className="font-semibold text-green-900">
            {result.status === 'programada' ? `Campaña programada para ${result.recipients} destinatario(s).`
              : `Campaña procesada: ${result.sent ?? 0} enviado(s)${result.failed ? `, ${result.failed} con error` : ''} de ${result.recipients} destinatario(s).`}
            {result.excluded > 0 && ` Se excluyeron ${result.excluded} contacto(s) que no cumplen las condiciones.`}
          </p>
          <Link to="/admin/email-marketing/campanas" className="font-semibold underline">Ver resultados</Link>
        </div>
      )}

      <div className="space-y-6">
        <section className="card p-5 sm:p-6" aria-labelledby="em-1">
          <h2 id="em-1" className="text-xl">1. Datos de la campaña</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="em-name" className="label">Nombre interno *</label>
              <input id="em-name" className="field" maxLength={120} placeholder="Ej. Promoción octubre" value={draft.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <label htmlFor="em-subject" className="label">Asunto *</label>
              <input id="em-subject" className="field" maxLength={200} value={draft.subject} onChange={(e) => set('subject', e.target.value)} aria-describedby="em-subject-help" />
              <p id="em-subject-help" className="mt-1 text-xs">Puedes usar las variables {'{{nombre}}'} y {'{{apellido}}'}.</p>
            </div>
            <div>
              <label htmlFor="em-sender" className="label">Nombre del remitente</label>
              <input id="em-sender" className="field" maxLength={80} value={draft.sender_name} onChange={(e) => set('sender_name', e.target.value)} />
            </div>
            <div>
              <p className="label">Correo remitente</p>
              <p className="field !bg-beige">{config.loading ? 'Cargando…' : config.data?.sender_email ?? 'Por configurar'}</p>
              <p className="mt-1 text-xs">Se define en <Link to="/admin/configuracion" className="underline">Configuración</Link> o en los secrets del servidor.</p>
            </div>
            <fieldset className="sm:col-span-2">
              <legend className="label">Tipo de comunicación</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  ['comercial', 'Comercial', 'Promociones, novedades y recomendaciones. Solo para contactos con consentimiento de marketing.'],
                  ['operativa', 'Operativa', 'Avisos sobre una consulta o pedido existente. No admite contenido promocional.'],
                ] as const).map(([value, label, help]) => (
                  <label key={value} className="flex cursor-pointer gap-3 rounded-2xl border border-arena bg-crema p-4 text-sm has-[:checked]:border-terracota has-[:checked]:bg-rosa-suave">
                    <input type="radio" name="kind" className="mt-1 accent-terracota" checked={draft.kind === value} onChange={() => changeKind(value)} />
                    <span><span className="font-bold text-chocolate">{label}</span><span className="block">{help}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </section>

        <section className="card p-5 sm:p-6" aria-labelledby="em-2">
          <h2 id="em-2" className="mb-4 text-xl">2. Contenido del mensaje</h2>
          <EmailEditor value={draft.html} onChange={(html) => set('html', html)} />
        </section>

        <section className="card p-5 sm:p-6" aria-labelledby="em-3">
          <h2 id="em-3" className="mb-4 text-xl">3. Selección de destinatarios</h2>
          <Status loading={contacts.loading} error={contacts.error} empty={!contacts.data?.length && 'Aún no hay contactos en el CRM.'}>
            <RecipientPicker contacts={contacts.data ?? []} kind={draft.kind} selected={selected}
              onChange={(ids, segment) => { setSelected(ids); set('segment', segment) }} />
          </Status>
        </section>

        <section className="card p-5 sm:p-6" aria-labelledby="em-4">
          <h2 id="em-4" className="text-xl">4. Revisar y enviar</h2>
          <div className="mt-4 max-w-sm">
            <label htmlFor="em-schedule" className="label">Programar envío (opcional)</label>
            <input id="em-schedule" type="datetime-local" className="field" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            <p className="mt-1 text-xs">Déjalo vacío para enviar ahora. Los envíos programados requieren la tarea automática activa.</p>
          </div>
          {error && <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}
          {notice && <p role="status" className="notice mt-4">{notice}</p>}
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" className="btn-secondary" disabled={busy} onClick={openPreview}>Previsualizar correo</button>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => guard(async () => setDialog('test'))}>Enviar prueba</button>
            <button type="button" className="btn-ghost" disabled={busy} onClick={storeDraft}>Guardar borrador</button>
            <button type="button" className="btn-primary" disabled={busy || !selected.size}
              onClick={() => guard(async () => setDialog('confirm'))}>
              {scheduled ? 'Programar campaña' : 'Enviar campaña'}
            </button>
          </div>
        </section>
      </div>

      {dialog === 'preview' && preview && (
        <Modal title="Vista previa del correo" onClose={() => setDialog(null)} wide>
          <p className="notice mb-3">Vista previa: no se envía ningún correo. Las variables se reemplazan con datos demostrativos.</p>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm"><span className="font-semibold text-chocolate">Asunto:</span> {preview.subject}</p>
            <div role="group" aria-label="Dispositivo" className="inline-flex rounded-full border border-arena bg-crema p-1 text-sm font-semibold">
              {(['desktop', 'movil'] as const).map((d) => (
                <button key={d} type="button" aria-pressed={device === d} onClick={() => setDevice(d)}
                  className={`rounded-full px-4 py-1.5 ${device === d ? 'bg-terracota text-white' : 'text-chocolate-medio'}`}>
                  {d === 'desktop' ? 'Desktop' : 'Móvil'}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto rounded-2xl bg-beige p-3">
            {/* sandbox sin permisos: el HTML del correo no puede ejecutar scripts. */}
            <iframe title="Vista previa del correo" sandbox="" srcDoc={preview.html}
              className="mx-auto block h-[60dvh] rounded-xl border border-arena bg-white" style={{ width: device === 'desktop' ? 640 : 375, maxWidth: 'none' }} />
          </div>
        </Modal>
      )}

      {dialog === 'test' && (
        <Modal title="Enviar prueba" onClose={() => setDialog(null)}>
          <label htmlFor="em-test" className="label">Correo del administrador</label>
          <select id="em-test" className="field" value={testTo} onChange={(e) => setTestTo(e.target.value)}>
            {config.data?.test_recipients.map((r) => <option key={r}>{r}</option>)}
          </select>
          <p className="mt-2 text-xs">Solo se permiten correos de administrador autorizados. El asunto llevará el prefijo [PRUEBA] y no cuenta como campaña enviada.</p>
          {error && <p role="alert" className="field-error">{error}</p>}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" className="btn-ghost" onClick={() => setDialog(null)}>Cancelar</button>
            <button type="button" className="btn-primary" disabled={busy || !testTo} onClick={sendTest}>{busy ? 'Enviando…' : 'Enviar prueba'}</button>
          </div>
        </Modal>
      )}

      {dialog === 'confirm' && (
        <Modal title={scheduled ? 'Confirmar programación' : 'Confirmar envío'} onClose={() => setDialog(null)}>
          <p className="font-semibold text-chocolate">Estás a punto de {scheduled ? 'programar' : 'enviar'} esta campaña a {selected.size} destinatario(s).</p>
          <dl className="mt-4 divide-y divide-arena text-sm">
            {([
              ['Campaña', draft.name], ['Asunto', draft.subject], ['Tipo', draft.kind === 'comercial' ? 'Comercial' : 'Operativa'],
              ['Segmento', segmentLabel], ['Cantidad', String(selected.size)],
              ...(scheduled ? [['Fecha de envío', new Date(scheduledAt).toLocaleString('es-PE')]] : []),
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="grid grid-cols-[7rem_1fr] gap-3 py-2"><dt>{k}</dt><dd className="break-words font-semibold text-chocolate">{v}</dd></div>
            ))}
          </dl>
          {error && <p role="alert" className="field-error">{error}</p>}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" className="btn-ghost" onClick={() => setDialog(null)}>Cancelar</button>
            <button type="button" className="btn-primary" disabled={busy} onClick={confirmSend}>{busy ? 'Procesando…' : 'Confirmar envío'}</button>
          </div>
        </Modal>
      )}
    </>
  )
}
