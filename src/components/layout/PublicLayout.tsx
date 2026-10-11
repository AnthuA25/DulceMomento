import { lazy, Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { WhatsAppLink } from '@/components/WhatsAppLink'
import { Footer } from './Footer'
import { Header } from './Header'

const DulceBot = lazy(() => import('@/components/chat/DulceBot'))

/** Al navegar: sube al inicio o se desplaza al ancla (#seccion) indicada. */
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return
    }
    // Espera a que la sección exista (las páginas se cargan de forma diferida).
    const timer = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView(), 80)
    return () => clearTimeout(timer)
  }, [pathname, hash])
  return null
}

export function PublicLayout() {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-chocolate focus:px-4 focus:py-2 focus:text-white"
      >
        Saltar al contenido
      </a>
      <ScrollManager />
      <Header />
      <main id="contenido">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppLink
        origin="flotante"
        className="btn-primary fixed bottom-4 right-4 z-30 !px-4 shadow-lg sm:!px-6"
      >
        <span className="sr-only sm:not-sr-only">Pedir por WhatsApp</span>
      </WhatsAppLink>
      <Suspense fallback={null}>
        <DulceBot />
      </Suspense>
    </>
  )
}
