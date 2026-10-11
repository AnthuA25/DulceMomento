import { Cake, LogOut } from 'lucide-react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { isBackendConfigured, isDemoBackend } from '@/lib/supabase'

const links = [
  { to: '/admin/inicio', label: 'Inicio' },
  { to: '/admin/contactos', label: 'Contactos' },
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/email-marketing', label: 'Email marketing' },
  { to: '/admin/automatizaciones', label: 'Automatizaciones' },
  { to: '/admin/configuracion', label: 'Configuración' },
]

/** Las páginas de administración nunca deben indexarse. */
export function AdminMeta({ title }: { title: string }) {
  return (
    <>
      <title>{`${title} · Admin Dulce Momento`}</title>
      <meta name="robots" content="noindex, nofollow" />
    </>
  )
}

/**
 * Protege todo /admin: sin sesión de administrador se redirige al login.
 * La protección real de los datos está en RLS; esto solo evita mostrar el panel vacío.
 */
export default function AdminLayout() {
  const { status, email, signOut } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <p className="p-10 text-center" role="status">Verificando sesión…</p>
  if (status !== 'admin') return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />

  return (
    <div className="min-h-dvh bg-crema">
      <AdminMeta title="Panel" />
      <header className="sticky top-0 z-30 border-b border-arena bg-marfil">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <p className="flex items-center gap-2 font-display text-lg font-semibold text-chocolate">
            <Cake className="h-5 w-5 text-terracota" aria-hidden="true" />
            <span className="hidden sm:inline">Panel administrativo — </span>Dulce Momento
          </p>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-chocolate-suave md:inline">{email}</span>
            <button type="button" onClick={signOut} className="btn-ghost btn-sm">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Salir
            </button>
          </div>
        </div>
        <nav aria-label="Administración" className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6">
          <ul className="flex gap-1">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to}
                  className={({ isActive }) => `block whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold ${
                    isActive ? 'border-terracota text-terracota-oscuro' : 'border-transparent text-chocolate-medio hover:text-chocolate'}`}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {isDemoBackend && <p className="notice mb-6">Modo demo local: todos los datos y envíos de marketing se simulan en este navegador.</p>}
        {!isDemoBackend && !isBackendConfigured && <p className="notice mb-6">Falta configurar Supabase (.env).</p>}
        <Outlet />
      </main>
    </div>
  )
}
