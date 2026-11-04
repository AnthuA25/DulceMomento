import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Seo } from '@/components/Seo'
import { useCustomerAuth } from '@/contexts/CustomerAuthContext'
import { isFirebaseConfigured } from '@/lib/firebase'

type Mode = 'login' | 'register'

export default function Account() {
  const { status, signIn, signUp, signOut } = useCustomerAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const destination = (location.state as { from?: string } | null)?.from
  const next = destination === '/checkout' ? '/checkout' : '/mi-cuenta'

  if (status === 'customer') return <Navigate to={next} replace />

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError('')
    setNotice('')
    setBusy(true)
    try {
      if (mode === 'login') {
        await signIn(String(form.get('email')), String(form.get('password')))
        navigate(next, { replace: true })
      } else {
        const signedIn = await signUp({
          first_name: String(form.get('first_name')),
          last_name: String(form.get('last_name')),
          phone: String(form.get('phone')),
          email: String(form.get('email')),
          password: String(form.get('password')),
        })
        if (signedIn) navigate(next, { replace: true })
        else {
          setMode('login')
          setNotice('Cuenta creada. Confirma tu correo y luego inicia sesión para continuar con la compra.')
        }
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo completar la operación.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="section !pt-10">
      <Seo title="Mi cuenta | Dulce Momento" description="Crea tu cuenta de cliente o inicia sesión para comprar." path="/cuenta" noindex />
      <div className="container-site max-w-xl">
        <div className="card p-6 sm:p-8">
          <p className="eyebrow text-center">Cuenta de cliente</p>
          <h1 className="mt-2 text-center text-3xl">{mode === 'login' ? 'Inicia sesión para comprar' : 'Crea tu cuenta'}</h1>
          <p className="mt-3 text-center text-sm">
            Necesitas una cuenta de cliente para completar pedidos y consultar tu historial. El acceso de administración es independiente.
          </p>

          {!isFirebaseConfigured && (
            <p className="notice mt-5" role="status">El registro y las compras estarán disponibles cuando se configure Firebase.</p>
          )}
          {status === 'admin' && (
            <div className="notice mt-5" role="status">
              Esta es una cuenta de administrador, no una cuenta de cliente.
              <Link to="/admin/inicio" className="ml-1 font-semibold underline">Ir al panel administrativo</Link>
              <button type="button" className="ml-3 font-semibold underline" onClick={() => void signOut()}>Cerrar sesión</button>
            </div>
          )}
          {status === 'unrecognized' && (
            <p className="notice mt-5" role="alert">Esta sesión no tiene un perfil de cliente.</p>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="account-first-name">Nombre</label>
                    <input id="account-first-name" name="first_name" className="field" autoComplete="given-name" minLength={2} maxLength={80} required />
                  </div>
                  <div>
                    <label className="label" htmlFor="account-last-name">Apellido</label>
                    <input id="account-last-name" name="last_name" className="field" autoComplete="family-name" minLength={2} maxLength={80} required />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="account-phone">WhatsApp / teléfono</label>
                  <input id="account-phone" name="phone" className="field" type="tel" autoComplete="tel"
                    pattern="[+]?[0-9 ]{6,20}" title="Ingresa un número de teléfono válido." required />
                </div>
              </>
            )}
            <div>
              <label className="label" htmlFor="account-email">Correo electrónico</label>
              <input id="account-email" name="email" className="field" type="email" autoComplete="email" maxLength={254} required />
            </div>
            <div>
              <label className="label" htmlFor="account-password">Contraseña</label>
              <input id="account-password" name="password" className="field" type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required />
              {mode === 'register' && <p className="mt-1 text-xs">Usa al menos 8 caracteres.</p>}
            </div>
            {error && <p className="field-error" role="alert">{error}</p>}
            {notice && <p className="notice" role="status">{notice}</p>}
            <button type="submit" className="btn-primary w-full" disabled={!isFirebaseConfigured || busy || status === 'admin'}>
              {busy ? 'Procesando…' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm">
            {mode === 'login' ? '¿Aún no tienes cuenta?' : '¿Ya tienes una cuenta?'}{' '}
            <button type="button" className="font-semibold text-terracota-oscuro underline"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setNotice('') }}>
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
          <p className="mt-4 text-center text-xs">¿Eres administrador? Usa el acceso privado que te proporcionó Dulce Momento.</p>
        </div>
      </div>
    </section>
  )
}
