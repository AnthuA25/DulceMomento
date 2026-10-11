import { Cake, Menu, ShoppingBag, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { WhatsAppLink } from '@/components/WhatsAppLink'
import { useCart } from '@/contexts/CartContext'
import { navLinks } from '@/data/site'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap font-display text-xl font-semibold text-chocolate ${className}`}>
      <Cake className="h-6 w-6 text-terracota" aria-hidden="true" />
      Dulce Momento
    </Link>
  )
}

function CartLink() {
  const { count } = useCart()
  return (
    <Link
      to="/carrito"
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-chocolate hover:bg-beige"
      aria-label={count ? `Carrito, ${count} ${count === 1 ? 'producto' : 'productos'}` : 'Carrito vacío'}
    >
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      {count > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-terracota px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  )
}

export function Header() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => setOpen(false), [location])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="sticky top-0 z-40 border-b border-arena bg-crema/95 backdrop-blur">
      <div className="mx-auto flex h-[60px] w-full max-w-[80rem] items-center gap-4 px-5 sm:px-6">
        <Logo />
        <nav aria-label="Principal" className="ml-2 hidden flex-1 items-center justify-center gap-4 xl:flex">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="whitespace-nowrap text-sm text-chocolate-medio hover:text-terracota-oscuro">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <CartLink />
          <WhatsAppLink origin="header" className="btn-primary btn-sm hidden whitespace-nowrap sm:inline-flex">
            Pedir por WhatsApp
          </WhatsAppLink>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-chocolate hover:bg-beige xl:hidden"
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="menu-movil" aria-label="Menú móvil" className="border-t border-arena bg-crema xl:hidden">
          <ul className="container-site grid gap-1 py-3 sm:grid-cols-2">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="block rounded-xl px-3 py-3 text-chocolate hover:bg-beige">
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-2 sm:hidden">
              <WhatsAppLink origin="menu-movil" className="btn-primary w-full">
                Pedir por WhatsApp
              </WhatsAppLink>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
