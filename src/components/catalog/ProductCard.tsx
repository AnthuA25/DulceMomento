import { ArrowRight, CakeSlice, Clock3, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "../../types/product";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="inspiration-card product-card">
      <Link
        className="inspiration-card__image-link product-card__image-link"
        to={`/producto/${product.slug}`}
        aria-label={`Ver detalles de ${product.name}`}
      >
        <img
          src={product.images[0]}
          alt={`${product.name}, imagen de referencia`}
          loading="lazy"
          decoding="async"
          className="inspiration-card__image"
        />
        {product.customizable && (
          <span className="product-card__flag">
            <Sparkles size={12} aria-hidden="true" />
            Personalizable
          </span>
        )}
      </Link>
      <div className="inspiration-card__body">
        <div className="product-card__meta">
          <span className="tag">{product.category}</span>
          <span className="product-card__price">
            {product.price === null
              ? "Consultar precio"
              : `S/ ${product.price.toFixed(2)}`}
          </span>
        </div>
        <h3>{product.name}</h3>
        <p>{product.shortDescription}</p>
        <div className="product-card__facts">
          <span>
            <CakeSlice size={13} aria-hidden="true" />
            {product.portions === null
              ? "Porciones por confirmar"
              : `${product.portions} porciones`}
          </span>
          <span>
            <Clock3 size={13} aria-hidden="true" />
            {product.available ? "Preparado por pedido" : "No disponible"}
          </span>
        </div>
        <Link
          className="button button--small product-card__details"
          to={`/producto/${product.slug}`}
        >
          Ver detalles
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
