import { ContactSection } from '@/components/home/ContactSection'
import { Seo } from '@/components/Seo'
import { WhatsAppLink } from '@/components/WhatsAppLink'
import { breadcrumbSchema } from '@/utils/structuredData'

export default function Contact() {
  return (
    <>
      <Seo
        title="Contacto y cotizaciones | Dulce Momento"
        description="Solicita una cotización o consulta por tu keke artesanal en Lima. Respondemos por correo y WhatsApp, y coordinamos delivery en San Isidro y alrededores."
        path="/contacto"
        jsonLd={breadcrumbSchema([{ name: 'Inicio', path: '/' }, { name: 'Contacto', path: '/contacto' }])}
      />
      <ContactSection heading="h1" />
      <section className="py-12 text-center">
        <div className="container-site">
          <h2 className="text-2xl">¿Prefieres escribirnos directamente?</h2>
          <p className="section-lead">Por WhatsApp coordinamos sabor, tamaño, fecha y entrega.</p>
          <WhatsAppLink origin="contacto" className="btn-primary mt-5">Pedir por WhatsApp</WhatsAppLink>
        </div>
      </section>
    </>
  )
}
