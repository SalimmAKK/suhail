/* Types for the schema in migrations/001_init.sql, 002_messages.sql and
   003_accounts.sql.

   Hand-written rather than generated, because generating requires a live
   project and the migration has not been run yet at the point this file is
   needed. Once the migration is applied, regenerate and replace this file:

     npx supabase gen types typescript --project-id <ref> > lib/database.types.ts

   If the two ever disagree, the SQL is the source of truth. */

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export type Database = {
  public: {
    Tables: {
      operators: {
        Row: {
          id: string;
          slug: string;
          name: string;
          contact_email: string | null;
          approved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          contact_email?: string | null;
          approved?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["operators"]["Insert"]>;
        Relationships: [];
      };
      sites: {
        Row: {
          id: string;
          slug: string;
          name: string;
          lat: number;
          lng: number;
          elevation_m: number | null;
          bortle_class: number | null;
          description: string | null;
          best_for: string[];
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          lat: number;
          lng: number;
          elevation_m?: number | null;
          bortle_class?: number | null;
          description?: string | null;
          best_for?: string[];
        };
        Update: Partial<Database["public"]["Tables"]["sites"]["Insert"]>;
        Relationships: [];
      };
      experiences: {
        Row: {
          id: string;
          operator_id: string;
          site_id: string;
          slug: string;
          title: string;
          description: string | null;
          duration_min: number | null;
          price_sar: number | null;
          group_min: number;
          group_max: number | null;
          requires_dark: boolean;
          active: boolean;
        };
        Insert: {
          id?: string;
          operator_id: string;
          site_id: string;
          slug: string;
          title: string;
          description?: string | null;
          duration_min?: number | null;
          price_sar?: number | null;
          group_min?: number;
          group_max?: number | null;
          requires_dark?: boolean;
          active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["experiences"]["Insert"]>;
        Relationships: [];
      };
      availability: {
        Row: {
          id: string;
          experience_id: string;
          date: string;
          slots_remaining: number;
        };
        Insert: {
          id?: string;
          experience_id: string;
          date: string;
          slots_remaining: number;
        };
        Update: Partial<Database["public"]["Tables"]["availability"]["Insert"]>;
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          experience_id: string;
          date: string;
          guest_count: number;
          contact_name: string;
          contact_email: string;
          contact_phone: string | null;
          status: BookingStatus;
          reference: string;
          created_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          experience_id: string;
          date: string;
          guest_count: number;
          contact_name: string;
          contact_email: string;
          contact_phone?: string | null;
          status?: BookingStatus;
          reference: string;
          created_at?: string;
          user_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          subject: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          subject: string;
          message: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
export type ExperienceRow = Database["public"]["Tables"]["experiences"]["Row"];
export type SiteRow = Database["public"]["Tables"]["sites"]["Row"];
export type OperatorRow = Database["public"]["Tables"]["operators"]["Row"];
