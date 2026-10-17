import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CakeSlice,
  Check,
  Clock3,
  Minus,
  Plus,
  Sparkles,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getProductBySlug } from "../data/products";
import { SiteFooter } from "../components/landing/LandingPage";
import { SiteHeader } from "../components/landing/SiteHeader";
import { NotFoundPage } from "./NotFoundPage";

export function ProductDetailPage() {
  const { slug } = useParams();
  const product = getProductBySlug(slug);
  const [quantity, setQuantity] = useState("1");
  const [customizationNote, setCustomizationNote] = useState("");

  useEffect(() => {
    if (!product) {
      return;
    }

    const previousTitle = document.title;
    const description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    const previousDescription = description?.content;

    document.title = product.seoTitle;
    if (description) {
      description.content = product.seoDescription;
    }

    return () => {
      document.title = previousTitle;
      if (description && previousDescription !== undefined) {
        description.content = previousDescription;
      }
    };
  }, [product]);

  if (!product) {
    return <NotFoundPage />;
  }

  return (
    <>
      <SiteHeader />
      <main className="product-detail-page">
        <div className="page-shell product-detail">
        <nav className="product-detail__breadcrumbs" aria-label="Ruta de navegación">
          <Link to="/">
            <ArrowLeft size={15} aria-hidden="true" />
            Inicio
          </Link>
          <span aria-hidden="true">/</span>
          <a href={`${import.meta.env.BASE_URL}#kekes`}>Nuestros kekes</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="product-detail__layout">
          <figure className="product-detail__image-wrap">
            <img
              src={product.images[0]}
              alt={`${product.name}, imagen de referencia`}
            />
            <figcaption>Imagen de referencia del diseño</figcaption>
          </figure>

          <section className="product-detail__content" aria-labelledby="product-title">
            <span className="tag">{product.category}</span>
            <h1 id="product-title">{product.name}</h1>
            <p className="product-detail__description">{product.description}</p>

            <div className="product-detail__facts" aria-label="Información del producto">
              <span>
                <CakeSlice size={17} aria-hidden="true" />
                Porciones: {product.portions ?? "por confirmar"}
              </span>
              <span>
                <Clock3 size={17} aria-hidden="true" />
                {product.available
                  ? "Preparado por pedido; fecha por confirmar"
                  : "No disponible actualmente"}
              </span>
            </div>

            <p className="product-detail__price">
              {product.price === null
                ? "Precio por confirmar"
                : `S/ ${product.price.toFixed(2)}`}
            </p>

            {product.customizable ? (
              <div className="product-detail__customization">
                <label htmlFor="customization-note">
                  <Sparkles size={15} aria-hidden="true" />
                  Cuéntanos tu idea de personalización
                </label>
                <textarea
                  id="customization-note"
                  maxLength={500}
                  rows={4}
                  placeholder="Describe qué tienes en mente. Las opciones se confirman antes de aceptar el pedido."
                  value={customizationNote}
                  onChange={(event) => setCustomizationNote(event.currentTarget.value)}
                  aria-describedby="customization-help customization-count"
                />
                <p id="customization-help">
                  Las opciones disponibles se coordinan para cada pedido.
                </p>
                <span id="customization-count" className="product-detail__counter">
                  {customizationNote.length}/500
                </span>
              </div>
            ) : (
              <p className="product-detail__not-customizable">
                <Check size={15} aria-hidden="true" />
                Las opciones adicionales de personalización se coordinan antes
                de confirmar el pedido.
              </p>
            )}

            <div className="product-detail__quantity">
              <label htmlFor="product-quantity">Cantidad</label>
              <div className="quantity-control">
                <button
                  type="button"
                  aria-label="Disminuir cantidad"
                  disabled={Number(quantity) <= 1}
                  onClick={() =>
                    setQuantity(String(Math.max(1, Number(quantity || "1") - 1)))
                  }
                >
                  <Minus size={15} aria-hidden="true" />
                </button>
                <input
                  id="product-quantity"
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(event) => {
                    const nextQuantity = event.currentTarget.value;
                    if (
                      /^\d*$/.test(nextQuantity) &&
                      (nextQuantity === "" ||
                        Number.isSafeInteger(Number(nextQuantity)))
                    ) {
                      setQuantity(nextQuantity);
                    }
                  }}
                  onBlur={() => {
                    if (!quantity || Number(quantity) < 1) {
                      setQuantity("1");
                    }
                  }}
                />
                <button
                  type="button"
                  aria-label="Aumentar cantidad"
                  onClick={() => setQuantity(String(Number(quantity || "0") + 1))}
                >
                  <Plus size={15} aria-hidden="true" />
                </button>
              </div>
            </div>

            <button
              className="button product-detail__add"
              type="button"
              disabled
              aria-describedby="cart-coming-soon"
            >
              Agregar al carrito
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            <p id="cart-coming-soon" className="product-detail__notice">
              El carrito se habilitará en una fase posterior. Confirma el precio
              y la disponibilidad antes de realizar tu pedido.
            </p>
            <Link className="text-link product-detail__back" to="/#contacto">
              Consultar sobre este keke
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </section>
        </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
