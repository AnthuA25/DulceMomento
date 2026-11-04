import { useState } from 'react'
import { Link } from 'react-router-dom'
import { crmStageLabels, crmStageOrder, lifecycleLabels } from '@/data/site'
import { useAsync } from '@/hooks/useAsync'
import { listContacts, setCrmStage } from '@/services/admin'
import type { CrmStage } from '@/types'
import { AdminMeta } from './AdminLayout'
import { Badge, customerTypeTone, lifecycleTone, PageHeader, Status } from './components/ui'

export default function Pipeline() {
  const { data, loading, error, reload } = useAsync(listContacts)
  const [busyId, setBusyId] = useState('')
  const [actionError, setActionError] = useState('')

  const moveContact = async (id: string, stage: CrmStage) => {
    setBusyId(id)
    setActionError('')
    try {
      await setCrmStage(id, stage)
      reload()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'No se pudo actualizar el estado del contacto.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <>
      <AdminMeta title="Pipeline CRM" />
      <PageHeader eyebrow="Seguimiento de oportunidades" title="Pipeline CRM" />
      <p className="notice mb-5">
        Cambia el estado desde cada tarjeta. El pipeline comercial es independiente del Customer Lifecycle y del número de consultas.
      </p>
      {actionError && <p role="alert" className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{actionError}</p>}
      <Status loading={loading} error={error} empty={!data?.length && 'Aún no hay contactos para mostrar en el pipeline.'}>
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[70rem] grid-cols-7 items-start gap-3">
            {crmStageOrder.map((stage) => {
              const contacts = (data ?? []).filter((contact) => contact.crm_stage === stage)
              return (
                <section key={stage} aria-labelledby={`pipeline-${stage}`} className="min-h-64 rounded-3xl bg-beige p-3">
                  <h2 id={`pipeline-${stage}`} className="flex items-center justify-between gap-2 px-1 text-sm font-bold text-chocolate">
                    <span>{crmStageLabels[stage]}</span>
                    <span className="rounded-full bg-marfil px-2 py-0.5 text-xs" aria-label={`${contacts.length} contactos`}>
                      {contacts.length}
                    </span>
                  </h2>
                  <ul className="mt-3 space-y-3">
                    {contacts.map((contact) => (
                      <li key={contact.id} className="rounded-2xl border border-arena bg-crema p-3">
                        <Link to={`/admin/contactos/${contact.id}`} className="font-semibold text-chocolate underline decoration-terracota/50 underline-offset-2">
                          {contact.first_name} {contact.last_name}
                        </Link>
                        <p className="mt-1 break-all text-xs">{contact.email}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge tone={customerTypeTone[contact.customer_type]}>
                            {contact.customer_type === 'nuevo' ? 'Nuevo' : 'Recurrente'}
                          </Badge>
                          <Badge tone={lifecycleTone[contact.lifecycle_stage]}>{lifecycleLabels[contact.lifecycle_stage]}</Badge>
                        </div>
                        <label htmlFor={`pipeline-stage-${contact.id}`} className="sr-only">
                          Cambiar estado de {contact.first_name} {contact.last_name}
                        </label>
                        <select
                          id={`pipeline-stage-${contact.id}`}
                          className="field mt-3 !px-2 !py-2 text-xs"
                          value={stage}
                          disabled={busyId === contact.id}
                          onChange={(e) => moveContact(contact.id, e.target.value as CrmStage)}
                        >
                          {crmStageOrder.map((option) => (
                            <option key={option} value={option}>{crmStageLabels[option]}</option>
                          ))}
                        </select>
                      </li>
                    ))}
                    {!contacts.length && <li className="px-1 py-3 text-center text-xs text-chocolate-suave">Sin contactos</li>}
                  </ul>
                </section>
              )
            })}
          </div>
        </div>
      </Status>
    </>
  )
}
