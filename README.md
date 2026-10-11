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
| Backend y base de datos | Supabase (PostgreSQL + RLS + Edge Functions en Deno) |
| Autenticación | Supabase Auth (solo administradores) |
| Email | Resend, llamado únicamente desde Edge Functions |
| Pruebas | Vitest + PGlite (PostgreSQL en memoria) + Playwright sobre Edge/Chrome |

## Estructura

```
src/
  data/        catalog.ts (fuente única de productos) · faq.ts (FAQ + AEO + Dulce Bot) · site.ts
  components/  layout, home, chat (Dulce Bot), ProductCard, ContactForm, Faq, Seo…
  pages/       Home, Products, ProductDetail, Personalizados, Contact, Cart, Checkout, Thanks…
  admin/       Login, Dashboard, Contacts, ContactDetail, Orders, EmailMarketing, Campaigns, Automations, Settings
  contexts/    CartContext · SettingsContext · AuthContext
  services/    public.ts (formulario, pedido) · admin.ts (panel) · payments.ts
  utils/ lib/ hooks/ types/
supabase/
  migrations/0001_schema.sql   tablas, funciones, RLS y datos iniciales
  seed.sql                     catálogo (generado desde src/data/catalog.ts)
  functions/                   submit-inquiry · create-order · admin-email · run-automations · email-webhook · unsubscribe
  functions/_shared/           email.ts (sendTransactionalEmail, sendCampaignEmail, sendTestEmail) · templates.ts · sanitize.ts · rules.ts
  cron.sql                     programación de automatizaciones
scripts/       generate.ts (sitemap, robots, seed) · create-admin.mjs
tests/         db.test.ts · app.test.ts · e2e/
```

## Instalación

```bash
npm install
cp .env.example .env.local     # completar las variables (ver abajo)
npm run dev                    # http://localhost:5173
```

Sin las variables de Supabase el sitio público funciona (catálogo, carrito, SEO, Dulce Bot informativo). Para una demo local del marketing y del panel administrativo, el proyecto activa automáticamente un modo de demostración con almacenamiento en `localStorage` y credenciales por defecto:

```bash
Usuario: admin
Contraseña: 2026USMP
```

Esto permite probar formulario, checkout, CRM y login sin conexión a Supabase. Si se desea, se pueden sobrescribir con:

```env
VITE_ADMIN_USER=admin
VITE_ADMIN_PASSWORD=2026USMP
```

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Genera sitemap/robots/seed, revisa tipos y compila a `dist/` |
| `npm test` | 44 pruebas: base de datos real en memoria, carrito, SEO, sanitización, correos |
| `npm run test:e2e` | 73 comprobaciones en navegador real (requiere Edge o Chrome) |
| `npm run admin:create -- correo` | Crea o actualiza el administrador |

## Variables de entorno

**Frontend (`.env.local`)** — públicas por diseño, quedan en el bundle:

| Variable | Uso |
| --- | --- |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima (pública) |
| `VITE_SITE_URL` | URL pública del sitio: canonical, Open Graph, sitemap |
| `VITE_ADMIN_EMAIL_DOMAIN` | Dominio del correo del admin; permite ingresar con `admin` |

**Solo scripts locales (`.env.local`, nunca con prefijo `VITE_`)**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (los usa únicamente `npm run admin:create`).

**Secrets de las Edge Functions** (`supabase secrets set NOMBRE=valor`):

| Secret | Uso |
| --- | --- |
| `RESEND_API_KEY` | API key del proveedor de email |
| `EMAIL_FROM` | Remitente verificado (alternativa: definirlo en /admin/configuracion) |
| `RESEND_WEBHOOK_SECRET` | Firma del webhook de eventos (`whsec_…`) |
| `CRON_SECRET` | Protege la función `run-automations` |
| `SITE_URL` | URL pública, para los enlaces de los correos |

Nunca se exponen en el frontend: service role, API keys, secretos ni contraseñas.

## Base de datos

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. Aplicar el esquema y el catálogo:
   ```bash
   npx supabase link --project-ref <PROJECT_REF>
   npx supabase db push                      # aplica supabase/migrations
   ```
   y ejecutar `supabase/seed.sql` en el SQL Editor (o `psql`). También se puede pegar `0001_schema.sql` y luego `seed.sql` directamente en el SQL Editor.

**Modelo** — un contacto tiene muchas consultas, pedidos, notas y eventos:

```
contacts ─┬─< inquiries          (request_code DM-XXXXXX, tipo, producto, origen, estado)
          ├─< orders ─┬─< order_items (personalización en options)
          │           └─< payments    (pendiente / en_verificacion / pagado / rechazado)
          ├─< crm_notes
          ├─< marketing_consents      (historial de altas y bajas)
          ├─< email_events            (sent, delivered, opened, clicked, bounced…)
          └─< campaign_recipients >─ campaigns
products · site_settings · admin_profiles · automations ─< automation_steps / automation_enrollments
```

Reglas implementadas en SQL (`0001_schema.sql`):

- **Contacto vs. consulta**: el email identifica al contacto. Si ya existe no se duplica; se crea otra consulta.
- **Nuevo / Recurrente** (`customer_type`): 1 consulta = Nuevo; 2 o más = Recurrente.
- **Customer lifecycle** (`lifecycle_stage`), independiente del anterior:
  `lead` (dejó sus datos) → `interesado` (2+ consultas, pidió cotización o registró un pedido) → `cliente` (1 pedido con pago verificado) → `cliente_recurrente` (2+) → `cliente_fidelizado` (N pedidos pagados, configurable; por defecto 4). Avanza solo; el admin puede corregirlo. "Visitante" no se almacena: es quien navega sin identificarse.
- **Precios**: `create_order` los calcula siempre desde `products`; el navegador solo envía ids y cantidades.
- **Pagos manuales**: nacen `pendiente` o `en_verificacion`. Solo `admin_set_payment_status` (administrador) los marca `pagado`.
- **RLS**: el público solo lee productos activos y la configuración pública. Todo dato de clientes exige administrador. Las escrituras públicas pasan por Edge Functions con validación, honeypot y límite de peticiones por IP.

## Edge Functions y email

```bash
npx supabase functions deploy submit-inquiry create-order admin-email run-automations email-webhook unsubscribe
npx supabase secrets set RESEND_API_KEY=... EMAIL_FROM=... SITE_URL=https://tu-dominio CRON_SECRET=... RESEND_WEBHOOK_SECRET=...
```

1. Crear una cuenta en [resend.com](https://resend.com) y **verificar un dominio propio** (necesario para enviar a clientes).
2. En `/admin/configuracion` indicar el email remitente y el email administrativo.
3. Para métricas reales, crear en Resend un webhook hacia `https://<PROJECT_REF>.supabase.co/functions/v1/email-webhook` con los eventos delivered, opened, clicked, bounced y complained, y guardar su secreto en `RESEND_WEBHOOK_SECRET`. Aperturas y clics requieren activar el seguimiento en el dominio de Resend. Si un dato no llega, el panel muestra "No disponible".
4. Para automatizaciones y campañas programadas, ejecutar `supabase/cron.sql` (cada 15 min). También existe el botón "Ejecutar ahora".

| Función | Qué hace |
| --- | --- |
| `submit-inquiry` | Formulario y Dulce Bot: valida → contacto → consulta → email de confirmación → aviso interno |
| `create-order` | Checkout: pedido + pago + correos |
| `admin-email` | Vista previa, envío de prueba `[PRUEBA]` y envío/programación de campañas (requiere sesión admin) |
| `run-automations` | Secuencias y campañas programadas |
| `email-webhook` | Registra eventos reales del proveedor (firma verificada) |
| `unsubscribe` | Baja de comunicaciones comerciales |

Consentimiento: una campaña **comercial** solo llega a contactos con `marketing_consent = true` (se comprueba al seleccionar, en el servidor y otra vez al enviar). Los correos transaccionales de la propia consulta o pedido no requieren consentimiento. Todo correo comercial incluye enlace de baja.

## Autenticación del administrador

- Acceso por `/admin` (sin enlaces desde el sitio público, `noindex` y bloqueado en robots.txt).
- La contraseña vive únicamente en Supabase Auth, como hash. **No hay credenciales en el código ni en el repositorio.**

```bash
# con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local
npm run admin:create -- admin@tu-dominio.com
# pide la contraseña inicial por terminal (no queda guardada en ningún archivo)
```

Con `VITE_ADMIN_EMAIL_DOMAIN=tu-dominio.com` se puede ingresar escribiendo solo `admin`. La contraseña se cambia en `/admin/configuracion → Cambiar contraseña`. Se recomienda desactivar el registro público en Supabase (Authentication → Sign In / Providers → "Allow new users to sign up"); aun con el registro abierto, un usuario sin fila en `admin_profiles` no ve ningún dato.

## Configuración pendiente ("Por configurar")

Estos datos no estaban en el diseño y no se inventaron. Se completan en `/admin/configuracion`:

- Número de WhatsApp (mientras falte, los botones abren WhatsApp sin destinatario).
- Redes sociales (los íconos del pie aparecen al configurarlas).
- Datos de Yape, Plin y cuenta bancaria (mientras falten, el checkout avisa que se envían por WhatsApp).
- Email remitente y email administrativo.
- Tarifas de delivery por distrito (sin tarifa, el total muestra "+ delivery por confirmar").

Otros pendientes de contenido: los **testimonios son demostrativos** (están rotulados así) y las **fotos** son recortes del diseño en baja resolución: conviene reemplazarlas en `public/img/` por los originales con el mismo nombre.

## Analítica

`src/lib/analytics.ts` publica en `window.dataLayer` los eventos `view_product`, `add_to_cart`, `begin_checkout`, `purchase_created`, `form_submit`, `lead_created`, `chatbot_open`, `whatsapp_click` y `email_campaign_sent`. **No hay Google Analytics conectado**: al instalar GTM/GA4 los eventos ya están disponibles.

## Despliegue en GitHub Pages

El repositorio `AnthuA25/DulceMomento` publica automáticamente la versión estática con GitHub Actions en:

`https://anthua25.github.io/DulceMomento/`

Cada push a `main` ejecuta tests y build, y luego publica `dist/`. En GitHub, habilitar **Settings → Pages → Build and deployment → GitHub Actions**. El modo sin Supabase es solo demostrativo: los datos viven en el almacenamiento local del navegador y no se comparten entre visitantes. Los correos y campañas se registran como simulación local; GitHub Pages no puede ejecutar las funciones servidoras ni enviar email real. Para formularios compartidos, CRM y correos reales hay que configurar el backend Supabase y Resend.

## Despliegue en otros hostings

1. Configurar las variables `VITE_*` en el hosting (Vercel, Netlify, Cloudflare Pages…).
2. Comando de build `npm run build`, directorio de salida `dist`.
3. Es una SPA: redirigir todas las rutas a `/index.html` (en Netlify, archivo `_redirects` con `/* /index.html 200`; en Vercel, un rewrite equivalente).
4. Definir `VITE_SITE_URL` y el secret `SITE_URL` con el dominio final antes de compilar (afecta canonical, sitemap y enlaces de correos).

## Pruebas

`npm test` y `npm run test:e2e` cubren las diez pruebas obligatorias: formulario → contacto/consulta/código; segundo envío sin duplicar y paso a Recurrente; consentimiento; exclusión en campañas comerciales; carrito; checkout; acceso a `/admin`; SEO; responsive. Usan únicamente **datos demostrativos en memoria**.

Lo que estas pruebas no pueden cubrir sin un proyecto real: el envío efectivo de correos por Resend y el despliegue de las Edge Functions en Supabase. Verificar ambos después de configurar el proyecto (enviar el formulario con un correo propio y revisar la bandeja y el CRM).

## Limitaciones conocidas

- Los metadatos SEO se generan en el navegador (SPA). Google los procesa; para asistentes que no ejecutan JavaScript conviene añadir prerenderizado.
- Los borradores de campaña se guardan en el historial pero no se reabren en el editor.
- No hay pasarela de pago online: `src/services/payments.ts` deja definida la interfaz para agregarla.
