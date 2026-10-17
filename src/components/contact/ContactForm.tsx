import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, Mail } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useForm, type SubmitErrorHandler } from "react-hook-form";
import { products } from "../../data/products";
import { isSupabaseConfigured } from "../../lib/supabase";
import {
  contactSchema,
  defaultContactValues,
  eventTypes,
  getLocalDateString,
  type ContactFormValues,
} from "../../features/contact/contactSchema";
import { submitContactInquiry } from "../../features/contact/submitContactInquiry";

type ContactFieldProps = {
  error?: string;
  id: string;
  label: string;
  required?: boolean;
  children: ReactNode;
};

function ContactField({
  error,
  id,
  label,
  required = false,
  children,
}: ContactFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="contact-field">
      <label htmlFor={id}>
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="contact-field__required">
              {" "}
              *
            </span>
            <span className="visually-hidden"> (requerido)</span>
          </>
        )}
      </label>
      {children}
      {error && (
        <p className="contact-field__error" id={errorId}>
          <AlertCircle size={13} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

export function ContactForm() {
  const [submissionNotice, setSubmissionNotice] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);
  const [submissionAttempted, setSubmissionAttempted] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: defaultContactValues,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  async function onValidSubmit(values: ContactFormValues) {
    setSubmissionAttempted(true);

    try {
      await submitContactInquiry(values);
      reset(defaultContactValues);
      setSubmissionNotice({
        type: "success",
        message: "Tu consulta quedó registrada. Nos pondremos en contacto contigo.",
      });
    } catch (error) {
      console.error("No se pudo guardar la consulta de contacto.", error);
      setSubmissionNotice({
        type: "error",
        message: isSupabaseConfigured
          ? "No pudimos guardar tu consulta. Inténtalo nuevamente en unos minutos."
          : "El formulario aún no está conectado a la base de datos. Tus datos no se enviaron ni guardaron.",
      });
    }
  }

  const onInvalidSubmit: SubmitErrorHandler<ContactFormValues> = () => {
    setSubmissionNotice(null);
  };

  return (
    <form
      className="contact-form"
      noValidate
      onChange={() => setSubmissionNotice(null)}
      onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}
    >
      <fieldset
        className="contact-form__fieldset"
        disabled={!isSupabaseConfigured || isSubmitting}
      >
        <legend className="visually-hidden">Formulario de consulta</legend>
        <div className="contact-form__fields">
          <ContactField
            id="contact-first-name"
            label="Nombre"
            required
            error={errors.firstName?.message}
          >
            <input
              autoComplete="given-name"
              id="contact-first-name"
              maxLength={80}
              placeholder="Tu nombre"
              {...register("firstName")}
              aria-required="true"
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={
                errors.firstName ? "contact-first-name-error" : undefined
              }
            />
          </ContactField>

          <ContactField
            id="contact-last-name"
            label="Apellido"
            required
            error={errors.lastName?.message}
          >
            <input
              autoComplete="family-name"
              id="contact-last-name"
              maxLength={80}
              placeholder="Tu apellido"
              {...register("lastName")}
              aria-required="true"
              aria-invalid={Boolean(errors.lastName)}
              aria-describedby={
                errors.lastName ? "contact-last-name-error" : undefined
              }
            />
          </ContactField>

          <ContactField
            id="contact-whatsapp"
            label="WhatsApp"
            required
            error={errors.whatsapp?.message}
          >
            <input
              autoComplete="tel"
              id="contact-whatsapp"
              inputMode="tel"
              maxLength={22}
              placeholder="987 654 321"
              type="tel"
              {...register("whatsapp")}
              aria-required="true"
              aria-invalid={Boolean(errors.whatsapp)}
              aria-describedby={
                errors.whatsapp ? "contact-whatsapp-error" : undefined
              }
            />
          </ContactField>

          <ContactField
            id="contact-email"
            label="Email"
            error={errors.email?.message}
          >
            <input
              autoComplete="email"
              id="contact-email"
              maxLength={254}
              placeholder="tu@email.com"
              type="email"
              {...register("email")}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "contact-email-error" : undefined}
            />
          </ContactField>

          <ContactField
            id="contact-event-type"
            label="Tipo de evento o consulta"
            required
            error={errors.eventType?.message}
          >
            <select
              id="contact-event-type"
              {...register("eventType")}
              aria-required="true"
              aria-invalid={Boolean(errors.eventType)}
              aria-describedby={
                errors.eventType ? "contact-event-type-error" : undefined
              }
            >
              <option value="">Selecciona una ocasión</option>
              {eventTypes.map((eventType) => (
                <option key={eventType} value={eventType}>
                  {eventType}
                </option>
              ))}
            </select>
          </ContactField>

          <ContactField
            id="contact-event-date"
            label="Fecha del evento"
            error={errors.eventDate?.message}
          >
            <input
              id="contact-event-date"
              min={getLocalDateString()}
              type="date"
              {...register("eventDate")}
              aria-invalid={Boolean(errors.eventDate)}
              aria-describedby={
                errors.eventDate ? "contact-event-date-error" : undefined
              }
            />
          </ContactField>

          <ContactField
            id="contact-quantity"
            label="Cantidad aproximada"
            error={errors.approximateQuantity?.message}
          >
            <input
              id="contact-quantity"
              inputMode="numeric"
              maxLength={12}
              placeholder="Ej. 12 kekes"
              {...register("approximateQuantity")}
              aria-invalid={Boolean(errors.approximateQuantity)}
              aria-describedby={
                errors.approximateQuantity
                  ? "contact-quantity-error"
                  : undefined
              }
            />
          </ContactField>

          <ContactField
            id="contact-product"
            label="Producto de interés"
            error={errors.productId?.message}
          >
            <select
              id="contact-product"
              {...register("productId")}
              aria-invalid={Boolean(errors.productId)}
              aria-describedby={
                errors.productId ? "contact-product-error" : undefined
              }
            >
              <option value="">Todavía no lo sé</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </ContactField>

          <ContactField
            id="contact-message"
            label="Mensaje"
            required
            error={errors.message?.message}
          >
            <textarea
              id="contact-message"
              maxLength={1000}
              placeholder="Cuéntanos sobre tu idea, fecha o celebración..."
              rows={4}
              {...register("message")}
              aria-required="true"
              aria-invalid={Boolean(errors.message)}
              aria-describedby={
                errors.message
                  ? "contact-message-error contact-message-hint"
                  : "contact-message-hint"
              }
            />
            <span className="visually-hidden" id="contact-message-hint">
              Escribe entre 10 y 1000 caracteres.
            </span>
          </ContactField>
        </div>

        <label
          className="contact-form__consent"
          htmlFor="contact-marketing-consent"
        >
          <input
            id="contact-marketing-consent"
            type="checkbox"
            {...register("marketingConsent")}
            aria-describedby="contact-consent-note"
          />
          <span>
            <span className="contact-form__consent-text">
              Sí, quiero recibir novedades, promociones y recomendaciones por
              correo electrónico.
            </span>
            <span id="contact-consent-note">
              Opcional. No afecta la atención de tu consulta; puedes retirar tu
              autorización escribiéndonos.
            </span>
          </span>
        </label>

        {submissionNotice && (
          <div
            className={`contact-form__submission-note contact-form__submission-note--${submissionNotice.type}`}
            role={submissionNotice.type === "error" ? "alert" : "status"}
            tabIndex={-1}
          >
            <AlertCircle size={17} aria-hidden="true" />
            <p>{submissionNotice.message}</p>
          </div>
        )}

        <div className="contact-form__actions">
          <button className="button" disabled={isSubmitting} type="submit">
            {isSubmitting
              ? "Enviando..."
              : submissionAttempted
                ? "Enviar otra consulta"
                : isSupabaseConfigured
                  ? "Enviar consulta"
                  : "Consultas próximamente"}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </fieldset>

      {!isSupabaseConfigured && (
        <p className="contact-form__pending">
          <AlertCircle size={15} aria-hidden="true" />
          Las consultas estarán disponibles cuando conectemos la base de datos.
          No ingreses tus datos por ahora.
        </p>
      )}

      <p className="contact-form__marketing-note">
        <Mail size={13} aria-hidden="true" />
        Solo registraremos tu autorización si marcas la casilla opcional.
      </p>
    </form>
  );
}
