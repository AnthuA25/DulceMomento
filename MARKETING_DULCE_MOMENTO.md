# Marketing digital — Dulce Momento

## Contexto y propuesta de valor

Dulce Momento ofrece kekes artesanales preparados por pedido en Lima. La comunicación del sitio destaca la elaboración por pedido, la personalización disponible en el catálogo, la presentación cuidada y la coordinación cercana del delivery. Precios, zonas, pagos y disponibilidad deben mantenerse alineados con el catálogo y la configuración del negocio; no se deben completar con cifras supuestas.

## Buyer persona: hipótesis por validar

El proyecto no contiene investigación de clientes ni métricas históricas suficientes para afirmar perfiles demográficos como hechos. Para orientar las primeras pruebas se pueden validar estas necesidades:

- Personas que organizan cumpleaños, aniversarios o reuniones y buscan un keke listo para compartir o regalar.
- Personas que desean coordinar una dedicatoria, colores o decoración antes de una fecha especial.
- Oficinas o grupos que necesitan porciones para una reunión.

Validar estas hipótesis mediante consultas recibidas, entrevistas breves y resultados de campañas antes de fijar edad, presupuesto, ubicación exacta u otros atributos.

## Embudo de marketing

1. **Atracción:** redes sociales, recomendaciones y búsquedas locales sobre kekes artesanales o personalizados en Lima.
2. **Descubrimiento:** páginas públicas optimizadas para SEO/AEO, catálogo y preguntas frecuentes con respuestas basadas en las condiciones reales del negocio.
3. **Interés:** fichas de productos, personalización, galería, delivery y Dulce Bot.
4. **Captación:** formulario de contacto o registro desde el chatbot; cada persona se guarda una vez y cada solicitud genera una consulta independiente.
5. **Seguimiento:** CRM con origen, tipo de contacto, estado del pipeline e historial de consultas.
6. **Conversión:** coordinación por WhatsApp o checkout; el pago manual permanece pendiente/en verificación hasta confirmación administrativa.
7. **Retención y recomendación:** mensajes operativos del pedido; contenido comercial, recompra y fidelización únicamente con consentimiento vigente.

## CRM y customer lifecycle

- **Contacto:** registro único por correo normalizado. Se actualiza sin duplicarlo cuando vuelve a consultar.
- **Consulta:** cada formulario, solicitud del chatbot u otra interacción que requiere seguimiento crea un registro propio.
- **Tipo de contacto:** nuevo con una consulta; recurrente con dos o más. No implica compra.
- **Pipeline comercial:** Nuevo → Contactado → Interesado → Cotización → Confirmado → Entregado, con Perdido como salida.
- **Customer Lifecycle:** Lead → Interesado → Cliente → Cliente recurrente → Cliente fidelizado. La etapa de cliente depende de compras con pago verificado, no del número de consultas.
- **Notas:** registrar solo información útil para atender la solicitud y limitar el acceso al panel autenticado.

## Consentimiento y comunicaciones

El consentimiento para responder una consulta o coordinar un pedido no equivale a consentimiento de marketing. La casilla de novedades está desmarcada por defecto y no es obligatoria. Guardar la fecha y el origen de cada alta o baja. Las campañas comerciales y automatizaciones promocionales se restringen a contactos con consentimiento vigente; los mensajes transaccionales se limitan a la solicitud u orden correspondiente. Todo correo comercial incluye una opción de baja.

## Email marketing y automatizaciones

Tipos de contenido previstos: bienvenida, contenido útil, promocional, carrito abandonado, posventa y recompra. No se envían hasta configurar un proveedor de correo real y sus secretos exclusivamente en el backend. Una previsualización no cuenta como envío y una prueba solo se dirige a un correo administrativo autorizado.

Secuencia de lead propuesta:

| Momento | Objetivo |
| --- | --- |
| Día 0 | Agradecer el registro y orientar sobre los siguientes pasos |
| Día 2 | Resolver dudas de tamaño, porciones o anticipación |
| Día 4 | Mostrar opciones del catálogo y personalización disponible |
| Día 7 | Invitar a consultar o realizar un pedido |

Detener la secuencia comercial al confirmar una compra, retirar el consentimiento o registrar una baja. El carrito abandonado requiere identificar al usuario, confirmar que no compró y validar el consentimiento aplicable; hasta que el sistema capture esos datos, la métrica se muestra como no disponible.

## Analítica y optimización

GA4 se activa únicamente con `VITE_GA_MEASUREMENT_ID`. Eventos contemplados: `page_view`, `view_item`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`, `purchase`, `contact_form_submit`, `lead_created`, `whatsapp_click`, `chatbot_open` y `chatbot_order`.

Los eventos usan nombres de eventos, categorías de catálogo, moneda y valores agregados. No enviar nombre, apellido, email, teléfono, dirección, mensajes, datos de pago ni query strings. Sin GA4 o sin integración de sus reportes, el panel no presenta visitantes ni conversiones de Analytics como si estuvieran disponibles.

El ciclo de mejora es **recolectar → medir → analizar → decidir y mejorar**. Revisar consultas por origen, interacción con productos, abandonos de checkout y resultados de campañas; probar cambios pequeños y comparar periodos equivalentes. Las métricas se muestran solo si provienen de los datos disponibles.

## Criterios de calidad

- No publicar testimonios demostrativos como opiniones verificadas.
- No crear precios, tarifas, productos, zonas o cuentas de pago sin confirmación del negocio.
- Marcar cualquier conjunto de datos de ejemplo como demostrativo y evitar usar direcciones de correo reales.
- Revisar los consentimientos y resultados antes de cada campaña.
- Mantener separados los datos de marketing de la información necesaria para atender una compra.
