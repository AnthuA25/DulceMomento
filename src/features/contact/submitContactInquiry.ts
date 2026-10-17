import type { ContactFormValues } from "./contactSchema";
import { supabase } from "../../lib/supabase";

export async function submitContactInquiry(
  values: ContactFormValues,
): Promise<void> {
  if (!supabase) {
    throw new Error("La conexión con la base de datos no está configurada.");
  }

  const digits = values.whatsapp.replace(/\D/g, "");
  const { error } = await supabase.rpc("submit_contact_inquiry", {
    p_first_name: values.firstName.trim(),
    p_last_name: values.lastName.trim(),
    p_whatsapp: `+51${digits.slice(-9)}`,
    p_email: values.email.trim().toLowerCase() || null,
    p_event_type: values.eventType,
    p_event_date: values.eventDate || null,
    p_approximate_quantity: values.approximateQuantity
      ? Number(values.approximateQuantity)
      : null,
    p_product_id: values.productId || null,
    p_message: values.message.trim(),
    p_marketing_consent: values.marketingConsent,
  });

  if (error) {
    throw error;
  }
}
