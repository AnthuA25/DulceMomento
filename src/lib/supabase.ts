import { createClient } from "@supabase/supabase-js";

type Database = {
  public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      submit_contact_inquiry: {
        Args: {
          p_first_name: string;
          p_last_name: string;
          p_whatsapp: string;
          p_email: string | null;
          p_event_type: string;
          p_event_date: string | null;
          p_approximate_quantity: number | null;
          p_product_id: string | null;
          p_message: string;
          p_marketing_consent: boolean;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;
