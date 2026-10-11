import { Cake } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { DEMO_CREDENTIALS, isBackendConfigured, isDemoBackend } from '@/lib/supabase'
import { AdminMeta } from './AdminLayout'

export default function Login() {
  const { status, signIn, signOut } = useAuth()
  const location = useLocation()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (status === 'admin') {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from?.startsWith('/admin/') ? from : '/admin/inicio'} replace />
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    setError('')
    setBusy(true)
    try {
      await signIn(String(data.get('user') ?? ''), String(data.get('password') ?? ''))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-crema to-rosa-suave p-4">
      <AdminMeta title="Ingresar" />
      <div className="card w-full max-w-sm p-7">
        <p className="flex items-center justify-center gap-2 font-display text-xl font-semibold text-chocolate">
          <Cake className="h-6 w-6 text-terracota" aria-hidden="true" />
          Dulce Momento
        </p>
        <h1 className="mt-4 text-center text-2xl">Panel administrativo</h1>

        {!isBackendConfigured && (
          <p className="notice mt-5">
            {isDemoBackend
              ? `Modo demo local activado. Usa ${DEMO_CREDENTIALS.user} / ${DEMO_CREDENTIALS.password}.`
              : 'El panel necesita la conexión con Supabase. Configura las variables de entorno indicadas en el README.'}
          </p>
        )}
        {status === 'forbidden' && (
          <div className="notice mt-5" role="alert">
            Tu usuario no tiene permisos de administrador.{' '}
            <button type="button" className="font-semibold underline" onClick={signOut}>Cerrar sesión</button>
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="l-user" className="label">Usuario</label>
            <input id="l-user" name="user" className="field" autoComplete="username" autoCapitalize="none" required />
          </div>
          <div>
            <label htmlFor="l-password" className="label">Contraseña</label>
            <input id="l-password" name="password" type="password" className="field" autoComplete="current-password" required />
          </div>
          {error && <p role="alert" className="field-error">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy || status === 'loading'}>
            {busy ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </main>
  )
}
