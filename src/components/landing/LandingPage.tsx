import {
  ArrowDown,
  ArrowRight,
  CakeSlice,
  Check,
  Clock3,
  Gift,
  Heart,
  MapPin,
  MessageCircle,
  PackageCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { BrandMark } from "../BrandMark";
import {
  celebrationMoments,
  frequentlyAskedQuestions,
  galleryImages,
  valueHighlights,
} from "../../data/landingData";
import { products } from "../../data/products";
import { ProductCard } from "../catalog/ProductCard";
import { ContactForm } from "../contact/ContactForm";
import { publicAsset } from "../../utils/publicAsset";
import { SiteHeader } from "./SiteHeader";

const highlightIcons = {
  cake: CakeSlice,
  heart: Heart,
  sparkles: Sparkles,
  pin: MapPin,
} as const;

const momentIcons = {
  gift: Gift,
  heart: Heart,
  users: UsersRound,
  sparkles: Sparkles,
} as const;

function HeroSection() {
  return (
    <section className="hero section-tint" id="inicio" aria-labelledby="hero-title">
      <div className="hero__inner page-shell">
        <div className="hero__copy">
          <p className="eyebrow">
            <span className="eyebrow__dot" aria-hidden="true" />
            Kekes artesanales · San Isidro, Lima
          </p>
          <h1 id="hero-title">Kekes artesanales para hacer más dulces tus momentos</h1>
          <p className="hero__description">
            Kekes preparados por pedido para cumpleaños, reuniones, oficina y
            momentos especiales.
          </p>
          <div className="hero__actions">
            <a className="button" href="#kekes">
              Ver nuestros kekes
              <ArrowRight size={16} aria-hidden="true" />
            </a>
            <a className="button button--outline" href="#contacto">
              Hacer una consulta
            </a>
          </div>
          <p className="hero__note">
            <MapPin size={14} aria-hidden="true" />
            Preparados por pedido en San Isidro, Lima
          </p>
        </div>
        <figure className="hero__image-wrap">
          <img
            className="hero__image"
            src={publicAsset("images/hero-cake.jpg")}
            alt="Pastel de celebración cuidadosamente decorado, imagen de inspiración"
            fetchPriority="high"
          />
          <figcaption className="hero__image-caption">
            <span className="hero__image-caption-icon">
              <Sparkles size={17} aria-hidden="true" />
            </span>
            <span>
              <strong>Un dulce momento</strong>
              <span>Hecho especialmente para compartir</span>
            </span>
          </figcaption>
          <span className="hero__image-decoration" aria-hidden="true">
            ✳
          </span>
        </figure>
      </div>
      <a className="hero__scroll" href="#propuesta" aria-label="Descubrir más">
        <ArrowDown size={15} aria-hidden="true" />
      </a>
    </section>
  );
}

function ValueStrip() {
  return (
    <section className="value-strip" id="propuesta" aria-label="Lo que nos inspira">
      <div className="page-shell value-strip__grid">
        {valueHighlights.map(({ icon, title, detail }) => {
          const Icon = highlightIcons[icon];
          return (
            <article className="value-item" key={title}>
              <span className="value-item__icon">
                <Icon size={17} aria-hidden="true" />
              </span>
              <span>
                <strong>{title}</strong>
                <span>{detail}</span>
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SectionHeading({
  id,
  eyebrow,
  title,
  description,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="section-heading">
      {eyebrow && <p className="section-heading__eyebrow">{eyebrow}</p>}
      <h2 id={id}>{title}</h2>
      {description && <p className="section-heading__description">{description}</p>}
    </div>
  );
}

function InspirationSection() {
  return (
    <section className="section inspiration-section" id="kekes" aria-labelledby="kekes-title">
      <div className="page-shell">
        <SectionHeading
          id="kekes-title"
          eyebrow="Un dulce comienzo"
          title="Nuestros kekes"
          description="Ideas para celebrar, compartir y crear un momento especial."
        />
        <p className="inspiration-section__note">
          Galería de inspiración: los productos disponibles, sus detalles y
          precios se confirman al coordinar cada pedido.
        </p>
        <div className="inspiration-grid" aria-label="Catálogo de kekes">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PersonalizationSection() {
  return (
    <section
      className="section personalization-section section-tint"
      id="personaliza"
      aria-labelledby="personaliza-title"
    >
      <div className="page-shell personalization">
        <figure className="personalization__image-wrap">
          <img
            src={publicAsset("images/cake-1559620192-032c4bc4674e.jpg")}
            alt="Pastel de celebración con decoración floral, imagen de inspiración"
            loading="lazy"
            decoding="async"
          />
          <figcaption>
            <Sparkles size={16} aria-hidden="true" />
            Un detalle hecho para ti
          </figcaption>
        </figure>
        <div className="personalization__copy">
          <p className="eyebrow">Un detalle a tu manera</p>
          <h2 id="personaliza-title">Hazlo único para tu momento</h2>
          <p>
            Cuéntanos qué celebras y conversemos sobre las opciones de
            personalización disponibles para tu pedido.
          </p>
          <div className="chip-list" aria-label="Ocasiones especiales">
            <span><Check size={14} aria-hidden="true" /> Cumpleaños</span>
            <span><Check size={14} aria-hidden="true" /> Reuniones</span>
            <span><Check size={14} aria-hidden="true" /> Celebraciones</span>
            <span><Check size={14} aria-hidden="true" /> Momentos especiales</span>
          </div>
          <a className="button" href="#contacto">
            Cuéntanos tu idea
            <ArrowRight size={16} aria-hidden="true" />
          </a>
          <p className="personalization__fine-print">
            Los diseños y opciones se confirman según disponibilidad.
          </p>
        </div>
      </div>
    </section>
  );
}

function MomentsSection() {
  return (
    <section className="section moments-section" aria-labelledby="moments-title">
      <div className="page-shell">
        <SectionHeading
          id="moments-title"
          eyebrow="Para compartir"
          title="Un keke para cada momento"
          description="Un detalle especial puede acompañar tus momentos favoritos."
        />
        <div className="moments-grid">
          {celebrationMoments.map(({ icon, title, detail }) => {
            const Icon = momentIcons[icon];
            return (
              <article className="moment-card" key={title}>
                <span className="moment-card__icon">
                  <Icon size={21} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{detail}</p>
                <span className="moment-card__foot">
                  <Check size={13} aria-hidden="true" />
                  Preparado por pedido
                </span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  const steps = [
    {
      number: "01",
      icon: MessageCircle,
      title: "Cuéntanos",
      description: "Comparte la ocasión y la fecha que tienes en mente.",
    },
    {
      number: "02",
      icon: CakeSlice,
      title: "Lo coordinamos",
      description: "Revisamos juntos las opciones y la disponibilidad.",
    },
    {
      number: "03",
      icon: PackageCheck,
      title: "Disfruta tu momento",
      description: "Confirmamos los detalles de preparación y entrega.",
    },
  ];

  return (
    <section className="section process-section section-tint" id="como-funciona" aria-labelledby="process-title">
      <div className="page-shell">
        <SectionHeading
          id="process-title"
          eyebrow="Sencillo y especial"
          title="Tu keke en 3 pasos"
          description="Del primer mensaje a un momento hecho para compartir."
        />
        <div className="process-grid">
          {steps.map(({ number, icon: Icon, title, description }) => (
            <article className="process-card" key={number}>
              <span className="process-card__number">{number}</span>
              <span className="process-card__icon">
                <Icon size={20} aria-hidden="true" />
              </span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
        <a className="button process-section__cta" href="#contacto">
          Cuéntanos qué celebras
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="section testimonials-section" id="opiniones" aria-labelledby="testimonials-title">
      <div className="page-shell">
        <SectionHeading
          id="testimonials-title"
          eyebrow="Momentos que nos inspiran"
          title="Lo que dicen nuestros clientes"
          description="Cada celebración tiene una historia especial."
        />
        <div className="testimonials-note">
          <span className="testimonials-note__icon">
            <Heart size={20} aria-hidden="true" />
          </span>
          <p>
            Aquí compartiremos opiniones verificadas de quienes ya celebraron
            con Dulce Momento.
          </p>
        </div>
      </div>
    </section>
  );
}

function GallerySection() {
  return (
    <section className="section gallery-section section-tint" aria-labelledby="gallery-title">
      <div className="page-shell">
        <SectionHeading
          id="gallery-title"
          eyebrow="Detalles para inspirarte"
          title="Galería"
          description="Ideas, decoraciones y pasteles para imaginar tu próximo momento."
        />
        <div className="gallery-grid">
          {galleryImages.map(({ image, alt }, index) => (
            <figure className={`gallery-item gallery-item--${index + 1}`} key={image}>
              <img src={image} alt={alt} loading="lazy" decoding="async" />
            </figure>
          ))}
        </div>
        <p className="gallery-note">
          Imágenes de inspiración. Los diseños disponibles se coordinan para cada pedido.
        </p>
      </div>
    </section>
  );
}

function DeliverySection() {
  return (
    <section className="section delivery-section" id="delivery" aria-labelledby="delivery-title">
      <div className="delivery-card">
        <div className="delivery-card__heading">
          <span className="delivery-card__icon">
            <MapPin size={19} aria-hidden="true" />
          </span>
          <div>
            <p className="section-heading__eyebrow">Con cariño hasta tu puerta</p>
            <h2 id="delivery-title">Delivery</h2>
            <p>Coordinamos la entrega contigo antes de confirmar tu pedido.</p>
          </div>
        </div>
        <div className="delivery-zones">
          <article>
            <strong>San Isidro</strong>
            <p>Delivery según las condiciones del negocio.</p>
          </article>
          <article>
            <strong>Miraflores, Magdalena, San Borja y Lince</strong>
            <p>La cobertura o un posible recargo se confirma al coordinar.</p>
          </article>
          <article>
            <strong>¿El costo aún no está definido?</strong>
            <p>Te informaremos: “Delivery por confirmar”.</p>
          </article>
          <article className="delivery-zones__note">
            <Clock3 size={16} aria-hidden="true" />
            <p>La fecha y los detalles de entrega se coordinan antes del pedido.</p>
          </article>
        </div>
        <a className="button" href="#contacto">
          Consultar mi zona
          <ArrowRight size={15} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section
      className="section faq-section section-tint"
      id="preguntas-frecuentes"
      aria-labelledby="faq-title"
    >
      <div className="page-shell faq-layout">
        <div className="faq-intro">
          <p className="eyebrow">Queremos ayudarte</p>
          <h2 id="faq-title">Preguntas frecuentes</h2>
          <p>
            Si necesitas confirmar disponibilidad o detalles de tu pedido,
            estamos para orientarte.
          </p>
          <a className="text-link" href="#contacto">
            Hacer una consulta
            <ArrowRight size={14} aria-hidden="true" />
          </a>
        </div>
        <div className="faq-list">
          {frequentlyAskedQuestions.map(({ question, answer }) => (
            <details className="faq-item" key={question}>
              <summary>
                <span>{question}</span>
                <span className="faq-item__toggle" aria-hidden="true" />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section
      className="section contact-section"
      id="contacto"
      aria-labelledby="contact-title"
    >
      <div className="page-shell">
        <SectionHeading
          id="contact-title"
          eyebrow="Un momento hecho para ti"
          title="¿Preparamos algo especial para ti?"
          description="Cuéntanos sobre tu celebración y coordinaremos las opciones disponibles."
        />
        <div className="contact-card">
          <figure className="contact-card__image">
            <img
              src={publicAsset("images/cake-1621303837174-89787a7d4729.jpg")}
              alt="Pastel de celebración rosado, imagen de inspiración"
              loading="lazy"
              decoding="async"
            />
            <figcaption>
              <Sparkles size={16} aria-hidden="true" />
              Dulces momentos, hechos con cariño
            </figcaption>
          </figure>
          <div className="contact-card__content">
            <span className="tag">Cuéntanos tu idea</span>
            <h2 id="contact-title">Empecemos a celebrar</h2>
            <p>
              Para preparar una propuesta, cuéntanos de tu evento, la fecha y
              qué keke tienes en mente.
            </p>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCallToAction() {
  return (
    <section className="final-cta section-tint">
      <div className="page-shell final-cta__content">
        <span className="final-cta__icon">
          <Heart size={22} aria-hidden="true" />
        </span>
        <p className="eyebrow">Hecho con cariño en San Isidro</p>
        <h2>¿Se te antojó? Hagamos tu momento más dulce.</h2>
        <p>Conversemos sobre tu idea y las opciones disponibles para tu fecha.</p>
        <a className="button" href="#contacto">
          Cuéntanos qué tienes en mente
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-shell site-footer__inner">
        <div className="site-footer__brand">
          <a href={`${import.meta.env.BASE_URL}#inicio`} aria-label="Dulce Momento, volver al inicio">
            <BrandMark />
          </a>
          <p>Kekes artesanales preparados por pedido en San Isidro, Lima.</p>
        </div>
        <nav className="site-footer__links" aria-label="Enlaces del pie de página">
          <a href={`${import.meta.env.BASE_URL}#kekes`}>Nuestros kekes</a>
          <a href={`${import.meta.env.BASE_URL}#personaliza`}>Personaliza</a>
          <a href={`${import.meta.env.BASE_URL}#delivery`}>Delivery</a>
          <a href={`${import.meta.env.BASE_URL}#preguntas-frecuentes`}>
            Preguntas frecuentes
          </a>
          <a href={`${import.meta.env.BASE_URL}#contacto`}>Contacto</a>
        </nav>
        <div className="site-footer__bottom">
          <span>© {new Date().getFullYear()} Dulce Momento</span>
          <span>Un detalle dulce para compartir.</span>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <>
      <a className="skip-link" href="#contenido-principal">
        Ir al contenido
      </a>
      <SiteHeader />
      <main id="contenido-principal">
        <HeroSection />
        <ValueStrip />
        <InspirationSection />
        <PersonalizationSection />
        <MomentsSection />
        <ProcessSection />
        <TestimonialsSection />
        <GallerySection />
        <DeliverySection />
        <FaqSection />
        <ContactSection />
        <FinalCallToAction />
      </main>
      <SiteFooter />
    </>
  );
}
