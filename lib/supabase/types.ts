/**
 * Hand-written subset of the database types we currently use.
 * Replace with the output of `npx supabase gen types typescript --local`
 * once the local stack is running.
 */

export type PropertyStatus = "draft" | "published" | "sold";
export type PropertyType = "house" | "townhouse" | "apartment" | "land";
export type ListingType = "sale" | "rent";
export type LeadCategory = "hot" | "warm" | "cold";
export type MoveTimeline =
  | "asap"
  | "1_3_months"
  | "3_6_months"
  | "6_plus_months"
  | "just_browsing";

export type PropertyRow = {
  id: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  title: string;
  slug: string;
  status: PropertyStatus;
  property_type: PropertyType;
  listing_type: ListingType;
  price: number;
  address: string | null;
  suburb: string;
  city: string;
  province: string;
  is_gated_community: boolean;
  gated_community_name: string | null;
  bedrooms: number;
  bathrooms: number;
  garages: number;
  parking_spaces: number;
  floor_size_sqm: number | null;
  erf_size_sqm: number | null;
  year_built: number | null;
  features: string[];
  manual_description: string | null;
  ai_description: string | null;
  ai_seo_title: string | null;
  ai_seo_description: string | null;
  ai_neighbourhood_summary: string | null;
  ai_headline: string | null;
  ai_cta: string | null;
  agent_name: string | null;
  agent_phone: string | null;
  agent_email: string | null;
  agent_photo_url: string | null;
  /** Supabase Auth user id of the listing agent (dashboard scope). */
  assigned_user_id: string | null;
  /** Auth user id of the agent who sourced / mandated this listing. */
  sourced_by_user_id: string | null;
  /** Optional override: agent commission as % of sale price. */
  commission_percent: number | null;
  /** Optional override: fixed agent commission in ZAR (wins over %). */
  commission_amount: number | null;
  /** Final sale price when status is sold. */
  sold_price: number | null;
};

export type AgentAccountRow = {
  user_id: string;
  created_at: string;
  display_name: string | null;
  phone: string | null;
  email: string | null;
  /** Default agent commission as % of sale price for sale listings. */
  default_commission_percent: number | null;
};

export type PropertyImageRow = {
  id: string;
  property_id: string;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
  display_order: number;
  created_at: string;
};

export type LeadRow = {
  id: string;
  created_at: string;
  property_id: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  message: string | null;
  is_first_time_buyer: boolean;
  move_timeline: MoveTimeline | null;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  lead_score: number | null;
  lead_category: LeadCategory | null;
  ai_summary: string | null;
  contacted: boolean;
  contacted_at: string | null;
  consent_given_at: string;
  /** Auth user id of the agent whose share link was used to reach the site. */
  attributed_agent_user_id: string | null;
};

export type PageViewInsert = {
  property_id: string | null;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
};

/**
 * Insert types are intentionally permissive (Partial<Row>) because most
 * columns have DB defaults and we don't want the compiler to demand fields
 * the server will fill in. RLS + schema constraints enforce correctness at
 * runtime.
 *
 * Each table also declares an empty `Relationships: []` — Supabase's
 * `GenericTable` shape requires this, and omitting it causes the postgrest-js
 * type inference to fall back to `never` for inserts/updates.
 */
export type Database = {
  public: {
    Tables: {
      agent_accounts: {
        Row: AgentAccountRow;
        Insert: Pick<AgentAccountRow, "user_id"> &
          Partial<
            Pick<
              AgentAccountRow,
              "display_name" | "phone" | "email" | "default_commission_percent"
            >
          >;
        Update: Partial<AgentAccountRow>;
        Relationships: [];
      };
      properties: {
        Row: PropertyRow;
        Insert: Partial<PropertyRow>;
        Update: Partial<PropertyRow>;
        Relationships: [];
      };
      property_images: {
        Row: PropertyImageRow;
        Insert: Partial<PropertyImageRow>;
        Update: Partial<PropertyImageRow>;
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: LeadRow;
        Insert: Partial<LeadRow>;
        Update: Partial<LeadRow>;
        Relationships: [
          {
            foreignKeyName: "leads_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      page_views: {
        Row: PageViewInsert & {
          id: string;
          viewed_at: string;
        };
        Insert: PageViewInsert;
        Update: Partial<PageViewInsert>;
        Relationships: [
          {
            foreignKeyName: "page_views_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
