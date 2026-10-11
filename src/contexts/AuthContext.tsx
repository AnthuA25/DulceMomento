import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { BACKEND_MISSING, supabase } from '@/lib/supabase'

type Status = 'loading' | 'anonymous' | 'forbidden' | 'admin'

interface AuthContextValue {
  status: Status
  email: string | null
  signIn: (userOrEmail: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  changePassword: (password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Permite ingresar con un nombre de usuario ("admin") además del correo:
 * se completa con el dominio configurado. La contraseña solo la conoce
 * Supabase Auth (guardada como hash); aquí nunca se compara ni se almacena.
 */
function toEmail(userOrEmail: string): string {
  const value = userOrEmail.trim().toLowerCase()
  const domain = import.meta.env.VITE_ADMIN_EMAIL_DOMAIN as string | undefined
  return value.includes('@') || !domain ? value : `${value}@${domain}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<Status>(supabase ? 'loading' : 'anonymous')

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session as Session | null)
      if (!data.session) setStatus('anonymous')
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next as Session | null)
      if (!next) setStatus('anonymous')
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // La sesión por sí sola no basta: debe existir un perfil de administrador (lo decide RLS).
  const userId = session?.user.id
  useEffect(() => {
    if (!supabase || !userId) return
    let active = true
    supabase
      .from('admin_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => active && setStatus(data ? 'admin' : 'forbidden'))
    return () => {
      active = false
    }
  }, [userId])

  const signIn = useCallback(async (userOrEmail: string, password: string) => {
    if (!supabase) throw new Error(BACKEND_MISSING)
    setStatus('loading')
    const email = toEmail(userOrEmail)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setStatus('anonymous')
      throw new Error('Usuario o contraseña incorrectos.')
    }
    setSession({ user: { id: 'local-admin', email } } as Session)
    setStatus('admin')
  }, [])

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut()
  }, [])

  const changePassword = useCallback(async (password: string) => {
    if (!supabase) throw new Error(BACKEND_MISSING)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw new Error('No se pudo cambiar la contraseña. Prueba con una contraseña diferente y más larga.')
  }, [])

  const value = useMemo(
    () => ({ status, email: session?.user.email ?? null, signIn, signOut, changePassword }),
    [status, session, signIn, signOut, changePassword],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
