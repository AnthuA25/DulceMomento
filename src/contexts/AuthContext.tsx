import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, updatePassword, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, firestore, isFirebaseConfigured, BACKEND_MISSING } from '@/lib/firebase'

type Status = 'loading' | 'anonymous' | 'forbidden' | 'admin'

interface AuthContextValue {
  status: Status
  email: string | null
  signIn: (userOrEmail: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  changePassword: (password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toEmail(userOrEmail: string): string {
  const value = userOrEmail.trim().toLowerCase()
  const domain = import.meta.env.VITE_ADMIN_EMAIL_DOMAIN as string | undefined
  return value.includes('@') || !domain ? value : `${value}@${domain}`
}

async function isAdministrator(user: User) {
  if (!firestore) return false
  const profile = await getDoc(doc(firestore, 'admins', user.uid))
  return profile.exists()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<Status>(isFirebaseConfigured ? 'loading' : 'anonymous')

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (next) => {
      setUser(next)
      if (!next) setStatus('anonymous')
    })
  }, [])

  useEffect(() => {
    if (!user) return
    let active = true
    setStatus('loading')
    isAdministrator(user).then((admin) => {
      if (active) setStatus(admin ? 'admin' : 'forbidden')
    }).catch(() => {
      if (active) setStatus('forbidden')
    })
    return () => { active = false }
  }, [user])

  const signIn = useCallback(async (userOrEmail: string, password: string) => {
    if (!auth) throw new Error(BACKEND_MISSING)
    setStatus('loading')
    try {
      await signInWithEmailAndPassword(auth, toEmail(userOrEmail), password)
    } catch {
      setStatus('anonymous')
      throw new Error('Usuario o contraseña incorrectos.')
    }
  }, [])

  const signOut = useCallback(async () => {
    if (auth) await firebaseSignOut(auth)
  }, [])

  const changePassword = useCallback(async (password: string) => {
    if (!user) throw new Error(BACKEND_MISSING)
    try {
      await updatePassword(user, password)
    } catch {
      throw new Error('No se pudo cambiar la contraseña. Vuelve a ingresar e inténtalo otra vez.')
    }
  }, [user])

  const value = useMemo(
    () => ({ status, email: user?.email ?? null, signIn, signOut, changePassword }),
    [status, user, signIn, signOut, changePassword],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
