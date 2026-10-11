import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { defaultSettings } from '@/data/site'
import { supabase } from '@/lib/supabase'
import type { PublicSettings } from '@/types'

const SettingsContext = createContext<PublicSettings>(defaultSettings)

/** Configuración pública del negocio (WhatsApp, pagos, zonas). Se edita en /admin/configuracion. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(defaultSettings)

  useEffect(() => {
    if (!supabase) return
    let active = true
    supabase
      .from('site_settings')
      .select('key, value')
      .eq('is_public', true)
      .then(({ data }) => {
        if (!active || !data) return
        const loaded: Record<string, unknown> = {}
        for (const row of data) if (row.value !== null) loaded[row.key] = row.value
        setSettings({ ...defaultSettings, ...loaded })
      })
    return () => {
      active = false
    }
  }, [])

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>
}

export const useSettings = () => useContext(SettingsContext)
