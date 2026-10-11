import { AdminMeta } from './AdminLayout'
import { ContactsDirectory } from './components/ContactsDirectory'
import { PageHeader } from './components/ui'

export default function Contacts() {
  return (
    <>
      <AdminMeta title="Contactos" />
      <PageHeader eyebrow="Base de contactos & historial CRM" title="Contactos" />
      <ContactsDirectory />
    </>
  )
}
