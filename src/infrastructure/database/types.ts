export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          sirvoy_customer_id: string;
          account_owner: string;
          account_name: string;
          status: string;
          account_status: string | null;
          account_type: string;
          created_date: string;
          latest_login: string | null;
          last_cs_contact_date: string | null;
          billing_country: string | null;
          property_type: string | null;
          mrr: number | null;
          currency: string | null;
          languages: string[] | null;
          channels: string[] | null;
          health_score: number;
          health_classification: string;
          imported_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'imported_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
      };
      health_score_history: {
        Row: {
          id: string;
          sirvoy_customer_id: string;
          health_score: number;
          health_classification: string;
          snapshot_date: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['health_score_history']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['health_score_history']['Insert']>;
      };
      customer_activity_log: {
        Row: {
          id: string;
          sirvoy_customer_id: string;
          activity_type: string;
          description: string | null;
          metadata: Record<string, any> | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customer_activity_log']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['customer_activity_log']['Insert']>;
      };
    };
  };
};
