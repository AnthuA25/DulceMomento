import { z } from "zod";

export const eventTypes = [
  "Cumpleaños",
  "Reunión u oficina",
  "Aniversario",
  "Momento especial",
  "Consulta general",
] as const;

export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isValidPeruvianMobile(phoneNumber: string): boolean {
  const digits = phoneNumber.replace(/\D/g, "");
  return /^9\d{8}$/.test(digits) || /^519\d{8}$/.test(digits);
}

function isValidOptionalEmail(email: string): boolean {
  if (!email) {
    return true;
  }

  return z.email().safeParse(email).success;
}

function isOptionalPositiveInteger(value: string): boolean {
  if (!value) {
    return true;
  }

  return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
}

const isoDateSchema = z.iso.date();

export const contactSchema = z
  .object({
    firstName: z.string().trim().min(1, "Escribe tu nombre.").max(80),
    lastName: z.string().trim().min(1, "Escribe tu apellido.").max(80),
    whatsapp: z
      .string()
      .trim()
      .min(1, "Escribe tu número de WhatsApp.")
      .refine(
        isValidPeruvianMobile,
        "Ingresa un celular peruano válido de 9 dígitos.",
      ),
    email: z
      .string()
      .trim()
      .max(254, "El email es demasiado largo.")
      .refine(isValidOptionalEmail, "Ingresa un email válido."),
    eventType: z
      .union([z.literal(""), z.enum(eventTypes)])
      .refine(Boolean, "Selecciona el tipo de evento o consulta."),
    eventDate: z
      .string()
      .refine(
        (date) =>
          !date ||
          (isoDateSchema.safeParse(date).success &&
            date >= getLocalDateString()),
        "La fecha debe ser hoy o una fecha futura.",
      ),
    approximateQuantity: z
      .string()
      .refine(
        isOptionalPositiveInteger,
        "Ingresa una cantidad entera mayor que cero.",
      ),
    productId: z.string(),
    message: z
      .string()
      .trim()
      .min(10, "Cuéntanos un poco más (al menos 10 caracteres).")
      .max(1000, "El mensaje debe tener 1000 caracteres o menos."),
    marketingConsent: z.boolean(),
  })
  .superRefine((values, context) => {
    if (values.marketingConsent && !values.email) {
      context.addIssue({
        code: "custom",
        path: ["email"],
        message: "Agrega tu email si quieres recibir novedades.",
      });
    }
  });

export type ContactFormValues = z.infer<typeof contactSchema>;

export const defaultContactValues: ContactFormValues = {
  firstName: "",
  lastName: "",
  whatsapp: "",
  email: "",
  eventType: "",
  eventDate: "",
  approximateQuantity: "",
  productId: "",
  message: "",
  marketingConsent: false,
};
