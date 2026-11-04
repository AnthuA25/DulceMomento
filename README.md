# Dulce Momento

Aplicación web de **Dulce Momento — kekes artesanales por pedido (Lima)**: landing, catálogo, carrito, checkout, formulario, Dulce Bot, CRM, panel administrativo, email marketing y automatizaciones.

```
GOOGLE / REDES → SEO + AEO → LANDING → PRODUCTOS / FORMULARIO / DULCE BOT
      → CARRITO → CHECKOUT → PEDIDO → PAGO VERIFICADO → CLIENTE → POSVENTA → RECOMPRA
      → LEAD → CRM → EMAIL / WHATSAPP → INTERESADO ↗
```

## Tecnologías

| Capa | Tecnología |
| --- | --- |
| Frontend | React 19 + TypeScript + Vite + React Router |
| Estilos | Tailwind CSS 3 (colores y tipografías en `tailwind.config.js`) |
| Formularios | React Hook Form + Zod |
| Backend y base de datos | Firebase Authentication + Cloud Firestore |
| Seguridad de datos | Reglas de Firestore |
| Email | Desactivado en el plan Spark; requiere un servidor seguro |
| Pruebas | Vitest + PGlite (migraciones heredadas) + Playwright |

## Estructura

```
src/
  data/        catalog.ts (fuente única de productos) · faq.ts (FAQ + AEO + Dulce Bot) · site.ts
  components/  layout, home, chat (Dulce Bot), ProductCard, ContactForm, Faq, Seo…
  pages/       Home, Products, ProductDetail, Personalizados, Contact, Cart, Checkout, Account, CustomerAccount…
  admin/       Login, Dashboard, Contacts, ContactDetail, Pipeline, Orders, EmailMarketing, Campaigns, Automations, Settings
  contexts/    CartContext · SettingsContext · AuthContext · CustomerAuthContext
  services/    public.ts (formulario, pedido) · admin.ts (panel) · payments.ts
  utils/ lib/ hooks/ types/
firebase.json · firestore.rules · storage.rules
scripts/       generate.ts (sitemap, robots, seed)
tests/         db.test.ts · app.test.ts · e2e/
```

## Instalación

```bash
npm install
cp .env.example .env.local     # completar las variables (ver abajo)
npm run dev                    # http://localhost:5173
```

Sin las variables de Firebase el catálogo sigue disponible, pero las cuentas y operaciones remotas se deshabilitan. El plan Spark no ejecuta backend de confianza: las consultas y pedidos se escriben directamente con reglas, los pedidos quedan marcados para confirmar manualmente su precio, y no se envían correos ni se ejecutan automatizaciones o cargas de comprobantes.

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Genera sitemap/robots/seed, revisa tipos y compila a `dist/` |
| `npm test` | Pruebas de base de datos en memoria, CRM, pagos, campañas, carrito, SEO y analítica |
| `npm run test:e2e` | Comprobaciones en navegador real (requiere Edge o Chrome) |

## Variables de entorno

**Firebase Web App (`.env.local`)** — valores de configuración públicos, visibles en el navegador:

| Variable | Uso |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | API key de la app Web |
| `VITE_FIREBASE_AUTH_DOMAIN` | Dominio de Firebase Authentication |
| `VITE_FIREBASE_PROJECT_ID` | ID de proyecto |
| `VITE_FIREBASE_APP_ID` | ID de la app Web |
| `VITE_SITE_URL` | URL pública del sitio: canonical, Open Graph, sitemap |
| `VITE_GA_MEASUREMENT_ID` | ID de medición GA4 opcional (`G-...`); vacío significa que no se carga Analytics |
| `VITE_ADMIN_EMAIL_DOMAIN` | Dominio del correo del admin; permite ingresar con `admin` |

Las credenciales de administrador nunca se incluyen en el código ni en el repositorio. La API key de Firebase Web no es una credencial de administrador; el acceso lo controlan Authentication y las reglas.

## Firebase

1. Crear un proyecto Firebase en el plan Spark, registrar una aplicación Web y habilitar **Authentication → Email/Password** y **Cloud Firestore**.
2. Copiar la configuración de la aplicación Web a `.env.local` usando las variables `VITE_FIREBASE_*` de `.env.example`.
3. Publicar las reglas de seguridad desde la raíz del proyecto:
   ```powershell
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules --project dulce-momento-3d9a8
   ```
4. Crear el usuario administrador desde **Authentication → Users → Add user**. Copiar su UID y, en Firestore, crear el documento `admins/{UID}` (por ejemplo, con `display_name: "Administrador"`). Las reglas impiden crear ese documento desde la web.
5. Reiniciar `npm run dev` después de configurar las variables.

Colecciones activas: `admins`, `customerProfiles`, `siteSettings`, `contacts`, `inquiries`, `orders`, `crmNotes`, `campaigns`, `emailEvents`, `automations` y `automationEnrollments`. El directorio `supabase/` contiene el backend anterior y ya no lo usa la aplicación Firebase.

Comportamiento de la aplicación Firebase:

- **Contactos**: cada envío crea un registro; la deduplicación del CRM y los correos transaccionales requieren servidor, no incluidos en Spark.
- **Lifecycle**: el panel permite revisar y corregir etapas; el marcado manual de pagos pagados avanza el lifecycle a cliente.
- **Precios**: en Spark no hay función de servidor confiable; los pedidos se marcan `requires_price_verification`. El administrador debe validar precios y delivery con el cliente antes de verificar el pago.
- **Compra con cuenta**: el cliente debe registrarse o iniciar sesión antes del checkout. Firestore asocia el pedido con su UID y sus reglas solo permiten leer al dueño o al administrador. En `/mi-cuenta` solo puede consultar su historial.
- **Cuentas separadas**: `/cuenta` y `/mi-cuenta` son la vista del cliente; `/admin/login` y `/admin` siguen siendo la vista administrativa independiente. Tener cuenta de cliente no concede acceso al panel ni a los datos administrativos.
- **Pagos manuales**: se guardan pendientes; el administrador actualiza el estado desde el panel después de verificar el pago externamente.
- **Correos, automatizaciones y comprobantes**: desactivados en esta integración Spark; requieren backend con privilegios.
- **Acceso**: las reglas solo permiten al admin (documento `admins/{UID}`) leer CRM y modificar pedidos. El cliente solo lee su propio perfil e historial.

## Autenticación del administrador

- Acceso por `/admin` (sin enlaces desde el sitio público, `noindex` y bloqueado en robots.txt).
- Firebase Authentication administra las contraseñas; Firestore no guarda contraseñas.

```bash
# Authentication → Users → Add user: crea correo y contraseña
# Copia su UID y crea admins/{UID} en Firestore, desde Firebase Console
```

El administrador inicia sesión en `/admin/login` con su correo y contraseña. La contraseña se cambia desde `/admin/configuracion`. Crear una cuenta de cliente no concede acceso administrativo.

## Configuración pendiente ("Por configurar")

Estos datos no estaban en el diseño y no se inventaron. Se completan en `/admin/configuracion`:

- Número de WhatsApp (mientras falte, los botones abren WhatsApp sin destinatario).
- Redes sociales (los íconos del pie aparecen al configurarlas).
- Datos de Yape, Plin y cuenta bancaria (mientras falten, el checkout avisa que se envían por WhatsApp).
- Email remitente y email administrativo.
- Tarifas de delivery por distrito (sin tarifa, el total muestra "+ delivery por confirmar").

Otros pendientes de contenido: los **testimonios son demostrativos** (están rotulados así) y las **fotos** son recortes del diseño en baja resolución: conviene reemplazarlas en `public/img/` por los originales con el mismo nombre.

## Analítica

`src/lib/analytics.ts` carga GA4 solo cuando `VITE_GA_MEASUREMENT_ID` contiene un ID válido. Registra `page_view`, `view_item`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`, `purchase`, `contact_form_submit`, `lead_created`, `whatsapp_click`, `chatbot_open` y `chatbot_order`. Solo se envían rutas públicas, datos de catálogo y categorías controladas; nunca nombre, correo, teléfono, dirección, mensajes ni parámetros de URL. Sin ID, la aplicación sigue funcionando y no descarga el script de Analytics.

## Despliegue en GitHub Pages

El repositorio `AnthuA25/DulceMomento` publica automáticamente la versión estática con GitHub Actions en:

`https://anthua25.github.io/DulceMomento/`

Cada push a `main` ejecuta tests y build, y luego publica `dist/`. En GitHub, habilitar **Settings → Pages → Build and deployment → GitHub Actions**. Configura las variables de Actions `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` y `VITE_GA_MEASUREMENT_ID` en **Settings → Secrets and variables → Actions → Variables**. Son valores de configuración web que se envían al navegador; la seguridad depende de Authentication y las reglas de Firestore, no de ocultarlos. El workflow falla antes de compilar si falta alguno. Firebase Spark permite Authentication y Firestore dentro de sus cuotas; no ejecuta correos, tareas programadas ni validación de precios en servidor.

Para permitir el inicio de sesión desde el sitio publicado, agrega `anthua25.github.io` en Firebase Console → **Authentication → Settings → Authorized domains**.

## Despliegue en otros hostings

1. Configurar las variables `VITE_*` en el hosting (Vercel, Netlify, Cloudflare Pages…).
2. Comando de build `npm run build`, directorio de salida `dist`.
3. Es una SPA: redirigir todas las rutas a `/index.html` (en Netlify, archivo `_redirects` con `/* /index.html 200`; en Vercel, un rewrite equivalente).
4. Definir `VITE_SITE_URL` con el dominio final antes de compilar (afecta canonical, sitemap y Open Graph).

## Pruebas

`npm test` ejecuta pruebas de las migraciones SQL heredadas y del catálogo. `npm run test:e2e` compila una versión aislada sin configuración Firebase y verifica SEO, responsive y que Auth quede bloqueado sin credenciales; nunca escribe en el proyecto real.

Las pruebas locales no escriben al proyecto Firebase. Verifica Authentication, Firestore y reglas después de publicar la configuración. El envío de correos y las automatizaciones no están disponibles en Spark.

## Limitaciones conocidas

- Los metadatos SEO se generan en el navegador (SPA). Google los procesa; para asistentes que no ejecutan JavaScript conviene añadir prerenderizado.
- No hay pasarela de pago online: `src/services/payments.ts` deja definida la interfaz para agregarla.
- Google Analytics solo se activa después de configurar un ID GA4 válido; las métricas de visitantes no están disponibles en el panel CRM.

La estrategia y las reglas académicas de marketing se describen en [`MARKETING_DULCE_MOMENTO.md`](MARKETING_DULCE_MOMENTO.md).
