# SEO y AEO — Dulce Momento

Documento de trabajo de la estrategia de posicionamiento en buscadores (SEO) y en motores de respuesta y asistentes de IA (AEO). Todo el contenido usa información publicada en el sitio.

## 1. Keywords

No se dispone de datos reales de volumen de búsqueda; las siguientes son **hipótesis iniciales** que deben validarse con Google Search Console y Keyword Planner una vez publicado el sitio.

| Keyword | Intención | Página destino |
| --- | --- | --- |
| kekes personalizados Lima | Transaccional | `/kekes-personalizados` |
| kekes personalizados San Isidro | Transaccional local | `/kekes-personalizados` |
| kekes personalizados para cumpleaños | Transaccional | `/kekes-personalizados` · `/productos/keke-de-cumpleanos` |
| kekes para cumpleaños Lima | Transaccional | `/productos/keke-de-cumpleanos` |
| kekes artesanales Lima | Comercial | `/` · `/productos` |
| kekes delivery San Isidro | Transaccional local | `/` (sección Delivery) |
| keke de chocolate / zanahoria / vainilla Lima | Transaccional | ficha de cada producto |
| keke para reuniones / oficina | Comercial | `/productos/keke-para-reuniones` |

Criterio de redacción: cada keyword aparece de forma natural en title, H1 o primer párrafo de su página destino; no se repite artificialmente.

## 2. Intenciones de búsqueda y contenido

| Intención | Qué busca la persona | Cómo responde el sitio |
| --- | --- | --- |
| Informativa | "¿cuántas porciones tiene un keke?", "¿hacen delivery?" | FAQ con respuesta directa (inicio y `/kekes-personalizados`) |
| Comercial | Comparar sabores, tamaños y precio | Catálogo con precio, porciones y anticipación visibles en cada card |
| Transaccional | Pedir o cotizar | Carrito + checkout, formulario de cotización, WhatsApp |
| Local | Servicio en su distrito | Mención constante de San Isidro y Lima; sección Delivery |

## 3. Estructura y URLs

| URL | Title | H1 | Indexable |
| --- | --- | --- | --- |
| `/` | Dulce Momento \| Kekes artesanales en Lima *(editable en configuración)* | Kekes artesanales para acompañar tus momentos especiales. | Sí |
| `/productos` | Kekes artesanales en Lima: catálogo y precios \| Dulce Momento | Nuestros kekes artesanales | Sí |
| `/productos/:slug` | {Producto} artesanal en Lima \| Dulce Momento | {Producto} | Sí |
| `/kekes-personalizados` | Kekes Personalizados en Lima \| Dulce Momento | Kekes personalizados para cada ocasión | Sí |
| `/contacto` | Contacto y cotizaciones \| Dulce Momento | ¿Preparamos algo especial para ti? | Sí |
| `/carrito`, `/checkout`, `/gracias`, `/pedido-confirmado`, `/baja` | — | — | No (`noindex` + robots) |
| `/admin/*` | — | — | No (`noindex, nofollow` + robots) |

URLs de producto: `keke-de-chocolate`, `keke-de-vainilla`, `keke-de-zanahoria`, `keke-de-limon-y-arandanos`, `keke-de-cumpleanos`, `keke-para-reuniones`, `keke-personalizado`.

### Página SEO `/kekes-personalizados`

- **Meta description**: "Kekes personalizados en Lima con dedicatoria, colores y decoración a tu medida. Hechos por pedido para cumpleaños y momentos especiales, con delivery en San Isidro y alrededores."
- **H2**: Opciones de personalización · Kekes para cumpleaños y momentos especiales · Cómo realizar tu pedido · Delivery · Preguntas frecuentes.
- Cada H2 abre con una respuesta directa de una o dos frases, sigue con el detalle y termina con un CTA.

## 4. Metadata técnica

Implementada en `src/components/Seo.tsx`, por página:

- `<title>`, `meta description`, `link rel="canonical"`, `meta robots`.
- Open Graph (`og:title`, `og:description`, `og:url`, `og:image`, `og:type`, `og:locale = es_PE`) y `twitter:card`.
- Un único H1 por página y jerarquía H2/H3.
- `alt` descriptivo en imágenes de contenido; `alt=""` en decorativas.
- Migas de pan con enlaces internos en catálogo, fichas y página SEO; enlaces cruzados entre catálogo, personalizados, FAQ y contacto.
- `public/sitemap.xml` y `public/robots.txt` se generan en cada build desde el catálogo (`scripts/generate.ts`) usando `VITE_SITE_URL`.

Rendimiento: imagen principal precargada con `fetchpriority="high"`; el resto con `loading="lazy"`, `width`/`height` definidos (sin saltos de diseño); panel de administración, checkout y Dulce Bot se cargan bajo demanda.

## 5. Datos estructurados (JSON-LD)

Definidos en `src/utils/structuredData.ts`. Solo describen contenido visible y real.

| Tipo | Dónde | Notas |
| --- | --- | --- |
| `Bakery` (LocalBusiness) | Inicio | Nombre, URL, descripción, zona de servicio. Teléfono y redes solo si están configurados. Sin dirección ni horarios: el negocio no los publica. |
| `Product` + `Offer` | Fichas de producto | Precio S/ 50 en PEN. El keke personalizado no lleva `Offer` (precio según diseño). Sin valoraciones: no existen reseñas reales. |
| `BreadcrumbList` | Catálogo, fichas, página SEO, contacto | |
| `FAQPage` | Inicio y `/kekes-personalizados` | Solo donde las preguntas se muestran en la página. |

## 6. AEO

Estructura de cada respuesta: **pregunta → respuesta directa → detalle → CTA**.

Fuente única: `src/data/faq.ts` (`faqData`). La consumen la FAQ pública, el JSON-LD `FAQPage` y el Dulce Bot, por lo que una misma pregunta nunca tiene respuestas distintas.

| Pregunta | Respuesta directa | CTA |
| --- | --- | --- |
| ¿Con cuánta anticipación debo realizar mi pedido? | De 24 a 48 horas para los kekes clásicos y de 3 a 5 días para los pedidos personalizados. | Ver nuestros kekes |
| ¿Cuánto cuesta un keke? | Los kekes del catálogo tienen un precio único de S/ 50, todo incluido. | Ver precios |
| ¿Realizan kekes personalizados? | Sí. Personalizamos tu keke para que tenga el detalle exacto que imaginas. | Ver kekes personalizados |
| ¿Qué incluye la garantía de entrega? | Si tu pedido llega con más de 15 minutos de retraso o el keke llega dañado, lo reponemos sin costo. | Hacer una consulta |
| ¿Qué métodos de pago aceptan? | Aceptamos Yape, Plin y transferencia bancaria. | Ir al carrito |
| ¿Realizan delivery? | Sí. Nuestra zona principal es San Isidro y también entregamos en Lima y distritos alrededores. | Consultar mi dirección |
| ¿Puedo elegir el tamaño del keke? | Nuestros kekes rinden de 8 a 20 porciones según el producto. | Ver porciones por keke |
| ¿Cómo confirmo mi pedido? | Elige tu keke, agrégalo al carrito y completa tus datos, o escríbenos por WhatsApp. | Empezar mi pedido |

> Las preguntas provienen del diseño aprobado. Las respuestas se redactaron con los datos visibles en el sitio (precio, porciones, anticipación, garantía, delivery) y con los métodos de pago definidos para el proyecto; **el negocio debe revisarlas** antes de publicar.

## 7. Pendientes y medición

- Conectar Google Search Console y enviar el sitemap; validar keywords con datos reales.
- Instalar Google Analytics o GTM: los eventos ya se publican en `dataLayer` (ver README).
- Reemplazar los testimonios demostrativos por opiniones reales antes de añadir datos estructurados de reseñas.
- Evaluar prerenderizado de las páginas públicas para asistentes que no ejecutan JavaScript.
- Crear el Perfil de Empresa en Google si el negocio decide publicar una dirección o zona de servicio.
