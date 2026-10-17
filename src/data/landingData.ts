import { publicAsset } from "../utils/publicAsset";

export const navigationLinks = [
  { label: "Inicio", href: "#inicio" },
  { label: "Nuestros kekes", href: "#kekes" },
  { label: "Personaliza", href: "#personaliza" },
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Opiniones", href: "#opiniones" },
  { label: "Preguntas frecuentes", href: "#preguntas-frecuentes" },
  { label: "Contacto", href: "#contacto" },
] as const;

export const valueHighlights = [
  { icon: "cake", title: "Hechos por pedido", detail: "Preparados para tu ocasión" },
  { icon: "heart", title: "Un toque personal", detail: "Opciones por coordinar" },
  { icon: "sparkles", title: "Presentación cuidada", detail: "Cada detalle importa" },
  { icon: "pin", title: "San Isidro, Lima", detail: "Delivery por coordinar" },
] as const;

export const celebrationMoments = [
  { icon: "gift", title: "Cumpleaños", detail: "Un dulce centro para celebrar." },
  { icon: "heart", title: "Aniversarios", detail: "Un detalle para compartir." },
  { icon: "users", title: "Reuniones", detail: "Para disfrutar en buena compañía." },
  { icon: "sparkles", title: "Momentos especiales", detail: "Hecho a tu medida, por pedido." },
] as const;

export const inspirationCards = [
  {
    image: publicAsset("images/hero-cake.jpg"),
    alt: "Pastel decorado para una celebración, imagen de inspiración",
    title: "Un momento para celebrar",
    category: "Inspiración",
  },
  {
    image: publicAsset("images/cake-v1.jpg"),
    alt: "Pastel artesanal con decoración delicada, imagen de inspiración",
    title: "Algo especial para compartir",
    category: "Hecho por pedido",
  },
  {
    image: publicAsset("images/cake-1559620192-032c4bc4674e.jpg"),
    alt: "Postre para una ocasión especial, imagen de inspiración",
    title: "Un detalle a tu manera",
    category: "Personalizable",
  },
  {
    image: publicAsset("images/cake-1602351447937-745cb720612f.jpg"),
    alt: "Pastel con frutas para una mesa de celebración, imagen de inspiración",
    title: "Para compartir en familia",
    category: "Inspiración",
  },
  {
    image: publicAsset("images/cake-1565958011703-44f9829ba187.jpg"),
    alt: "Pastel de celebración con acabado artesanal, imagen de inspiración",
    title: "Una celebración especial",
    category: "Hecho por pedido",
  },
  {
    image: publicAsset("images/cake-1621303837174-89787a7d4729.jpg"),
    alt: "Pastel rosado decorado para una celebración, imagen de inspiración",
    title: "Un dulce recuerdo",
    category: "Personalizable",
  },
] as const;

export const frequentlyAskedQuestions = [
  {
    question: "¿Cómo puedo hacer un pedido?",
    answer:
      "Cuéntanos qué ocasión celebras y qué tienes en mente. La disponibilidad y los detalles se coordinan antes de confirmar el pedido.",
  },
  {
    question: "¿Puedo personalizar mi keke?",
    answer:
      "Sí. La personalización se coordina según las opciones disponibles para cada pedido.",
  },
  {
    question: "¿Hacen delivery?",
    answer:
      "El delivery en San Isidro se coordina según las condiciones del negocio. Otras zonas requieren confirmar cobertura.",
  },
  {
    question: "¿Cuánto cuesta el delivery?",
    answer:
      "El costo depende de la zona. Si no hay una tarifa configurada, se confirma contigo antes de cerrar el pedido.",
  },
  {
    question: "¿Con cuánta anticipación debo pedir?",
    answer:
      "La anticipación depende de la disponibilidad y de lo que quieras preparar. Consúltanos para revisar tu fecha antes de confirmar.",
  },
  {
    question: "¿Qué tamaño o porciones tiene cada keke?",
    answer:
      "Las porciones varían según el keke disponible. Confirma el tamaño y las porciones al coordinar tu pedido.",
  },
] as const;

export const galleryImages = [
  inspirationCards[2],
  {
    image: publicAsset("images/cake-1621303837174-89787a7d4729.jpg"),
    alt: "Pastel con capas y decoración para compartir, imagen de inspiración",
    title: "Capas para compartir",
    category: "Inspiración",
  },
  {
    image: publicAsset("images/cake-1602351447937-745cb720612f.jpg"),
    alt: "Pastel de chocolate decorado, imagen de inspiración",
    title: "Un detalle especial",
    category: "Inspiración",
  },
  inspirationCards[0],
  inspirationCards[4],
  inspirationCards[1],
] as const;
