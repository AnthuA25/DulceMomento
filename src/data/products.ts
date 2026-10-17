import type { Product } from "../types/product";
import { publicAsset } from "../utils/publicAsset";

const productImages = publicAsset("images/products");

export const products: Product[] = [
  {
    id: "keke-chocolate",
    slug: "keke-de-chocolate",
    name: "Keke de chocolate",
    shortDescription: "Una opción para compartir en ocasiones especiales.",
    description:
      "Preparado por pedido. Consulta disponibilidad y los detalles para tu ocasión.",
    price: null,
    images: [`${productImages}/keke-chocolate.jpg`],
    portions: null,
    category: "Keke artesanal",
    available: true,
    customizable: false,
    seoTitle: "Keke de chocolate | Dulce Momento",
    seoDescription:
      "Conoce el keke de chocolate de Dulce Momento y consulta los detalles de tu pedido.",
  },
  {
    id: "keke-vainilla",
    slug: "keke-de-vainilla",
    name: "Keke de vainilla",
    shortDescription: "Una opción para compartir en ocasiones especiales.",
    description:
      "Preparado por pedido. Consulta disponibilidad y los detalles para tu ocasión.",
    price: null,
    images: [`${productImages}/keke-vainilla.jpg`],
    portions: null,
    category: "Keke artesanal",
    available: true,
    customizable: false,
    seoTitle: "Keke de vainilla | Dulce Momento",
    seoDescription:
      "Conoce el keke de vainilla de Dulce Momento y consulta los detalles de tu pedido.",
  },
  {
    id: "keke-zanahoria",
    slug: "keke-de-zanahoria",
    name: "Keke de zanahoria",
    shortDescription: "Una opción para compartir en ocasiones especiales.",
    description:
      "Preparado por pedido. Consulta disponibilidad y los detalles para tu ocasión.",
    price: null,
    images: [`${productImages}/keke-zanahoria.jpg`],
    portions: null,
    category: "Keke artesanal",
    available: true,
    customizable: false,
    seoTitle: "Keke de zanahoria | Dulce Momento",
    seoDescription:
      "Conoce el keke de zanahoria de Dulce Momento y consulta los detalles de tu pedido.",
  },
  {
    id: "keke-arandanos",
    slug: "keke-de-limon-y-arandanos",
    name: "Keke de limón y arándanos",
    shortDescription: "Una opción para compartir en ocasiones especiales.",
    description:
      "Preparado por pedido. Consulta disponibilidad y los detalles para tu ocasión.",
    price: null,
    images: [`${productImages}/keke-arandanos.jpg`],
    portions: null,
    category: "Keke artesanal",
    available: true,
    customizable: false,
    seoTitle: "Keke de limón y arándanos | Dulce Momento",
    seoDescription:
      "Conoce el keke de limón y arándanos de Dulce Momento y consulta los detalles de tu pedido.",
  },
  {
    id: "keke-cumpleanos",
    slug: "keke-de-cumpleanos",
    name: "Keke de cumpleaños",
    shortDescription: "Una opción para compartir en ocasiones especiales.",
    description:
      "Preparado por pedido. Consulta disponibilidad y los detalles para tu ocasión.",
    price: null,
    images: [`${productImages}/keke-cumpleanos.jpg`],
    portions: null,
    category: "Keke artesanal",
    available: true,
    customizable: false,
    seoTitle: "Keke de cumpleaños | Dulce Momento",
    seoDescription:
      "Conoce el keke de cumpleaños de Dulce Momento y consulta los detalles de tu pedido.",
  },
  {
    id: "keke-reuniones",
    slug: "keke-para-reuniones",
    name: "Keke para reuniones",
    shortDescription: "Una opción para compartir en ocasiones especiales.",
    description:
      "Preparado por pedido. Consulta disponibilidad y los detalles para tu ocasión.",
    price: null,
    images: [`${productImages}/keke-reuniones.jpg`],
    portions: null,
    category: "Keke artesanal",
    available: true,
    customizable: false,
    seoTitle: "Keke para reuniones | Dulce Momento",
    seoDescription:
      "Conoce el keke para reuniones de Dulce Momento y consulta los detalles de tu pedido.",
  },
  {
    id: "keke-personalizado",
    slug: "keke-personalizado",
    name: "Keke personalizado",
    shortDescription: "Un keke especial con opciones por coordinar.",
    description:
      "La imagen de referencia muestra este keke como personalizable. Confirma las opciones disponibles para tu fecha antes de hacer el pedido.",
    price: null,
    images: [`${productImages}/keke-personalizado.jpg`],
    portions: null,
    category: "Personalizable",
    available: true,
    customizable: true,
    seoTitle: "Keke personalizado | Dulce Momento",
    seoDescription:
      "Consulta las opciones disponibles para personalizar un keke por pedido con Dulce Momento.",
  },
];

export function getProductBySlug(slug: string | undefined): Product | undefined {
  return products.find((product) => product.slug === slug);
}
