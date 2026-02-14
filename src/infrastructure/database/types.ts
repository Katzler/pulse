export type Database = {
  public: {
    Tables: {
      customers_current: {
        Row: {
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
          last_imported_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customers_current']['Row'], 'last_imported_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['customers_current']['Insert']>;
      };
      health_score_history: {
        Row: {
          sirvoy_customer_id: string;
          snapshot_date: string;
          health_score: number;
          health_classification: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['health_score_history']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['health_score_history']['Insert']>;
      };
      health_alerts: {
        Row: {
          id: string;
          sirvoy_customer_id: string;
          alert_type: string;
          old_score: number | null;
          new_score: number | null;
          score_change: number | null;
          message: string | null;
          triggered_at: string;
          acknowledged: boolean;
          acknowledged_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['health_alerts']['Row'], 'id' | 'triggered_at'>;
        Update: Partial<Database['public']['Tables']['health_alerts']['Insert']>;
      };
      portfolio_snapshots: {
        Row: {
          snapshot_date: string;
          total_customers: number;
          active_customers: number;
          avg_health_score: number;
          total_mrr: number;
          healthy_count: number;
          at_risk_count: number;
          critical_count: number;
          health_distribution: Record<string, number> | null;
          mrr_by_country: Record<string, number> | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['portfolio_snapshots']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['portfolio_snapshots']['Insert']>;
      };
      import_history: {
        Row: {
          id: string;
          import_type: string;
          customers_imported: number;
          customers_updated: number;
          alerts_generated: number;
          imported_at: string;
          imported_by: string | null;
          metadata: Record<string, any> | null;
        };
        Insert: Omit<Database['public']['Tables']['import_history']['Row'], 'id' | 'imported_at'>;
        Update: Partial<Database['public']['Tables']['import_history']['Insert']>;
      };
    };
  };
};
