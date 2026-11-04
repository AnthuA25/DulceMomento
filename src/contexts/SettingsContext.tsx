import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { defaultSettings } from '@/data/site'
import { firestore } from '@/lib/firebase'
import type { PublicSettings } from '@/types'

const SettingsContext = createContext<PublicSettings>(defaultSettings)

/** Configuración pública del negocio (WhatsApp, pagos, zonas). Se edita en /admin/configuracion. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(defaultSettings)

  useEffect(() => {
    if (!firestore) return
    let active = true
    getDocs(query(collection(firestore, 'siteSettings'), where('is_public', '==', true))).then((snapshot) => {
        if (!active) return
        const loaded: Record<string, unknown> = {}
        for (const row of snapshot.docs) {
          const value = row.data().value
          if (value !== null && value !== undefined) loaded[row.id] = value
        }
        setSettings({ ...defaultSettings, ...loaded })
      }).catch(() => {
        if (active) {
          console.error('No se pudo cargar la configuración pública de Firestore.')
          setSettings(defaultSettings)
        }
      })
    return () => {
      active = false
    }
  }, [])

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>
}

export const useSettings = () => useContext(SettingsContext)
