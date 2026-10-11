import { MessageCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { useSettings } from '@/contexts/SettingsContext'
import { trackWhatsApp, waMessages, whatsappLink } from '@/lib/whatsapp'

interface Props {
  children: ReactNode
  /** Mensaje con el que se abre la conversación. */
  message?: string
  /** Desde dónde se hizo clic (para analítica). */
  origin: string
  className?: string
  icon?: boolean
}

/** Enlace a WhatsApp con mensaje preparado. Abre la conversación; no envía nada por sí solo. */
export function WhatsAppLink({ children, message = waMessages.general, origin, className = 'btn-primary', icon = true }: Props) {
  const { whatsapp_number } = useSettings()
  return (
    <a
      href={whatsappLink(whatsapp_number, message)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => trackWhatsApp(origin)}
    >
      {icon && <MessageCircle className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />}
      {children}
    </a>
  )
}
