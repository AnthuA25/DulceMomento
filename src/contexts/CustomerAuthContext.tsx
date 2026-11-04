import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, type User } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, firestore, isFirebaseConfigured, BACKEND_MISSING } from '@/lib/firebase'

export interface CustomerProfile {
  user_id: string
  contact_id: string | null
  first_name: string
  last_name: string
  phone: string | null
}

type Role = 'loading' | 'anonymous' | 'customer' | 'admin' | 'unrecognized'

interface CustomerAuthValue {
  status: Role
  email: string | null
  profile: CustomerProfile | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: { first_name: string; last_name: string; phone: string; email: string; password: string }) => Promise<boolean>
  signOut: () => Promise<void>
}

const CustomerAuthContext = createContext<CustomerAuthValue | null>(null)

async function roleFor(user: User): Promise<{ role: Role; profile: CustomerProfile | null }> {
  if (!firestore) return { role: 'anonymous', profile: null }
  const customerSnapshot = await getDoc(doc(firestore, 'customerProfiles', user.uid))
  if (customerSnapshot.exists()) {
    const data = customerSnapshot.data()
    return {
      role: 'customer',
      profile: {
        user_id: user.uid,
        contact_id: data.contact_id ?? null,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone ?? null,
      },
    }
  }
  const adminSnapshot = await getDoc(doc(firestore, 'admins', user.uid))
  return { role: adminSnapshot.exists() ? 'admin' : 'unrecognized', profile: null }
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<Role>(isFirebaseConfigured ? 'loading' : 'anonymous')
  const [profile, setProfile] = useState<CustomerProfile | null>(null)

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (next) => {
      setUser(next)
      if (!next) {
        setProfile(null)
        setStatus('anonymous')
      }
    })
  }, [])

  useEffect(() => {
    if (!user) return
    let active = true
    setStatus('loading')
    roleFor(user).then(({ role, profile: nextProfile }) => {
      if (!active) return
      setProfile(nextProfile)
      setStatus(role)
    }).catch(() => {
      if (active) {
        setProfile(null)
        setStatus('unrecognized')
      }
    })
    return () => { active = false }
  }, [user])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error(BACKEND_MISSING)
    setStatus('loading')
    try {
      const { user: signedIn } = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
      const result = await roleFor(signedIn)
      setProfile(result.profile)
      setStatus(result.role)
      if (result.role !== 'customer') throw new Error('Esta cuenta no es de cliente. La administración tiene un acceso separado.')
    } catch (error) {
      setStatus('anonymous')
      if (error instanceof Error && error.message.includes('Esta cuenta')) throw error
      throw new Error('Correo o contraseña incorrectos.')
    }
  }, [])

  const signUp = useCallback(async (input: {
    first_name: string; last_name: string; phone: string; email: string; password: string
  }) => {
    if (!auth || !firestore) throw new Error(BACKEND_MISSING)
    const { user: created } = await createUserWithEmailAndPassword(auth, input.email.trim().toLowerCase(), input.password)
    await setDoc(doc(firestore, 'customerProfiles', created.uid), {
      uid: created.uid,
      email: created.email,
      first_name: input.first_name.trim(),
      last_name: input.last_name.trim(),
      phone: input.phone.trim(),
      created_at: new Date().toISOString(),
    })
    setUser(created)
    const result = await roleFor(created)
    setProfile(result.profile)
    setStatus(result.role)
    if (result.role !== 'customer') throw new Error('No se pudo preparar la cuenta de cliente.')
    return true
  }, [])

  const signOut = useCallback(async () => {
    if (auth) await firebaseSignOut(auth)
  }, [])

  const value = useMemo(() => ({
    status,
    email: user?.email ?? null,
    profile,
    signIn,
    signUp,
    signOut,
  }), [status, user, profile, signIn, signUp, signOut])

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext)
  if (!context) throw new Error('useCustomerAuth debe usarse dentro de CustomerAuthProvider')
  return context
}
