export type Database = {
  public: {
    Tables: {
      menus: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          price: number | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          duration_minutes: number;
          price?: number | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          duration_minutes?: number;
          price?: number | null;
          is_active?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };
      business_hours: {
        Row: {
          weekday: number;
          is_closed: boolean;
          open_time: string | null;
          close_time: string | null;
        };
        Insert: {
          weekday: number;
          is_closed?: boolean;
          open_time?: string | null;
          close_time?: string | null;
        };
        Update: {
          is_closed?: boolean;
          open_time?: string | null;
          close_time?: string | null;
        };
        Relationships: [];
      };
      closed_dates: {
        Row: {
          date: string;
          reason: string | null;
        };
        Insert: {
          date: string;
          reason?: string | null;
        };
        Update: {
          reason?: string | null;
        };
        Relationships: [];
      };
      reservations: {
        Row: {
          id: string;
          menu_id: string;
          line_user_id: string;
          customer_name: string;
          phone: string;
          time_range: string;
          start_at: string;
          end_at: string;
          status: "confirmed" | "cancelled";
          cancelled_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          menu_id: string;
          line_user_id: string;
          customer_name: string;
          phone: string;
          time_range: string;
          status?: "confirmed" | "cancelled";
          cancelled_at?: string | null;
          created_at?: string;
        };
        Update: {
          status?: "confirmed" | "cancelled";
          cancelled_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reservations_menu_id_fkey";
            columns: ["menu_id"];
            isOneToOne: false;
            referencedRelation: "menus";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
