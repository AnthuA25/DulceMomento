import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { CustomerAuthProvider, useCustomerAuth } from '@/contexts/CustomerAuthContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { track } from '@/lib/analytics'
import Home from '@/pages/Home'

// La landing viaja en el bundle inicial; el resto se carga bajo demanda.
const Products = lazy(() => import('@/pages/Products'))
const ProductDetail = lazy(() => import('@/pages/ProductDetail'))
const Personalizados = lazy(() => import('@/pages/Personalizados'))
const Contact = lazy(() => import('@/pages/Contact'))
const Cart = lazy(() => import('@/pages/Cart'))
const Checkout = lazy(() => import('@/pages/Checkout'))
const OrderConfirmed = lazy(() => import('@/pages/OrderConfirmed'))
const Thanks = lazy(() => import('@/pages/Thanks'))
const Unsubscribe = lazy(() => import('@/pages/Unsubscribe'))
const Account = lazy(() => import('@/pages/Account'))
const CustomerAccount = lazy(() => import('@/pages/CustomerAccount'))
const NotFound = lazy(() => import('@/pages/NotFound'))

const AdminLayout = lazy(() => import('@/admin/AdminLayout'))
const Login = lazy(() => import('@/admin/Login'))
const Dashboard = lazy(() => import('@/admin/Dashboard'))
const Contacts = lazy(() => import('@/admin/Contacts'))
const ContactDetail = lazy(() => import('@/admin/ContactDetail'))
const Pipeline = lazy(() => import('@/admin/Pipeline'))
const Orders = lazy(() => import('@/admin/Orders'))
const EmailMarketing = lazy(() => import('@/admin/EmailMarketing'))
const Campaigns = lazy(() => import('@/admin/Campaigns'))
const Automations = lazy(() => import('@/admin/Automations'))
const Settings = lazy(() => import('@/admin/Settings'))

const Loading = () => <p className="p-10 text-center" role="status">Cargando…</p>

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <PageViewTracker />
      <SettingsProvider>
        <CartProvider>
          <CustomerAuthProvider>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route element={<PublicLayout />}>
                  <Route index element={<Home />} />
                  <Route path="productos" element={<Products />} />
                  <Route path="productos/:slug" element={<ProductDetail />} />
                  <Route path="kekes-personalizados" element={<Personalizados />} />
                  <Route path="contacto" element={<Contact />} />
                  <Route path="carrito" element={<Cart />} />
                  <Route path="cuenta" element={<Account />} />
                  <Route path="checkout" element={<CustomerOnly><Checkout /></CustomerOnly>} />
                  <Route path="mi-cuenta" element={<CustomerOnly><CustomerAccount /></CustomerOnly>} />
                  <Route path="pedido-confirmado" element={<OrderConfirmed />} />
                  <Route path="gracias" element={<Thanks />} />
                  <Route path="baja" element={<Unsubscribe />} />
                  <Route path="*" element={<NotFound />} />
                </Route>

                {/* Área privada: sin enlaces desde el sitio público. */}
                <Route path="admin/*" element={<AuthProvider><AdminRoutes /></AuthProvider>} />
              </Routes>
            </Suspense>
          </CustomerAuthProvider>
        </CartProvider>
      </SettingsProvider>
    </BrowserRouter>
  )
}

function CustomerOnly({ children }: { children: ReactNode }) {
  const { status } = useCustomerAuth()
  const location = useLocation()
  if (status === 'loading') return <Loading />
  if (status !== 'customer') return <Navigate to="/cuenta" replace state={{ from: location.pathname }} />
  return children
}

function PageViewTracker() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (!pathname.startsWith('/admin')) track('page_view', { page_path: pathname })
  }, [pathname])
  return null
}

function AdminRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/inicio" replace />} />
          <Route path="inicio" element={<Dashboard />} />
          <Route path="contactos" element={<Contacts />} />
          <Route path="contactos/:id" element={<ContactDetail />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="pedidos" element={<Orders />} />
          <Route path="email-marketing" element={<EmailMarketing />} />
          <Route path="email-marketing/campanas" element={<Campaigns />} />
          <Route path="campanas" element={<Navigate to="/admin/email-marketing/campanas" replace />} />
          <Route path="automatizaciones" element={<Automations />} />
          <Route path="configuracion" element={<Settings />} />
          <Route path="*" element={<Navigate to="/admin/inicio" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
