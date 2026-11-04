import { Link } from 'react-router-dom'
import { useSettings } from '@/contexts/SettingsContext'
import { Logo } from './Header'

// Íconos de marca en SVG propio (lucide ya no incluye logotipos).
const icons = {
  Instagram: 'M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.200V7.8A5.8 5.8 0 0 1 7.8 2Zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.800-3.800V7.8A3.8 3.8 0 0 0 16.200 4H7.8Zm9.450 1.500a1.250 1.250 0 1 1 0 2.500 1.250 1.250 0 0 1 0-2.500ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  Facebook: 'M13.500 22v-8h2.700l.4-3.200h-3.100V8.750c0-.900.250-1.550 1.600-1.550h1.700V4.350A22 22 0 0 0 14.300 4.200c-2.450 0-4.100 1.500-4.100 4.250v2.350H7.500V14h2.700v8h3.300Z',
  TikTok: 'M16.600 2h-3.200v13.400a2.700 2.700 0 1 1-2.700-2.700c.250 0 .500.030.730.100V9.500a6 6 0 1 0 5.170 5.900V8.700a7.300 7.300 0 0 0 4.200 1.330V6.850A4.250 4.250 0 0 1 16.600 2Z',
}

export function Footer() {
  const s = useSettings()
  const socials = [
    { name: 'Instagram' as const, url: s.instagram_url },
    { name: 'Facebook' as const, url: s.facebook_url },
    { name: 'TikTok' as const, url: s.tiktok_url },
  ].filter((x) => x.url)

  return (
    <footer className="border-t border-arena bg-marfil py-12 text-center">
      <div className="container-site">
        <Logo />
        <p className="mt-4 text-sm text-chocolate-medio">Kekes artesanales por pedido · Lima · Delivery en San Isidro y alrededores</p>
        <nav aria-label="Pie de página" className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          <Link to="/kekes-personalizados" className="hover:text-terracota-oscuro">Kekes personalizados</Link>
          <Link to="/productos" className="hover:text-terracota-oscuro">Catálogo</Link>
          <Link to="/#preguntas" className="hover:text-terracota-oscuro">Preguntas frecuentes</Link>
          <Link to="/contacto" className="hover:text-terracota-oscuro">Contacto</Link>
        </nav>
        {socials.length > 0 && (
          <ul className="mt-5 flex justify-center gap-3">
            {socials.map((social) => (
              <li key={social.name}>
                <a
                  href={social.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Dulce Momento en ${social.name}`}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-chocolate hover:bg-beige"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d={icons[social.name]} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-5 text-xs text-chocolate-suave">© {new Date().getFullYear()} Dulce Momento. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}
