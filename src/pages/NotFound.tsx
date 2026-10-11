import { Link } from 'react-router-dom'
import { Seo } from '@/components/Seo'

export default function NotFound() {
  return (
    <section className="section text-center">
      <Seo title="Página no encontrada | Dulce Momento" description="La página que buscas no existe." path="/404" noindex />
      <div className="container-site">
        <h1 className="text-4xl">No encontramos esta página</h1>
        <p className="section-lead">Puede que el enlace haya cambiado. Te invitamos a ver nuestros kekes.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-secondary">Volver al inicio</Link>
          <Link to="/productos" className="btn-primary">Ver nuestros kekes</Link>
        </div>
      </div>
    </section>
  )
}
