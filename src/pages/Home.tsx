import { ContactSection } from '@/components/home/ContactSection'
import { Benefits, Hero } from '@/components/home/Hero'
import { ProductsSection } from '@/components/home/ProductsSection'
import { Delivery, FinalCta, Gallery, Occasions, Personalization, Steps, Testimonials } from '@/components/home/Sections'
import { Faq } from '@/components/Faq'
import { Seo } from '@/components/Seo'
import { useSettings } from '@/contexts/SettingsContext'
import { businessSchema, faqSchema } from '@/utils/structuredData'

export default function Home() {
  const settings = useSettings()
  return (
    <>
      <Seo
        title={settings.seo_title}
        description={settings.seo_description}
        path="/"
        jsonLd={[businessSchema(settings), faqSchema()]}
      />
      <Hero />
      <Benefits />
      <ProductsSection />
      <Personalization />
      <Occasions />
      <Steps />
      <Testimonials />
      <Gallery />
      <Delivery />
      <section id="preguntas" className="section">
        <div className="container-site">
          <h2 className="section-title mb-8">Preguntas frecuentes</h2>
          <Faq />
        </div>
      </section>
      <ContactSection />
      <FinalCta />
    </>
  )
}
