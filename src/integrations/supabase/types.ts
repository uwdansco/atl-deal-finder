export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action_description: string
          action_type: string
          admin_user_id: string
          affected_record_id: string | null
          affected_table: string | null
          created_at: string
          id: string
          metadata: Json | null
        }
        Insert: {
          action_description: string
          action_type: string
          admin_user_id: string
          affected_record_id?: string | null
          affected_table?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          action_description?: string
          action_type?: string
          admin_user_id?: string
          affected_record_id?: string | null
          affected_table?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      booking_guarantee_claims: {
        Row: {
          admin_notes: string | null
          claim_status: Database["public"]["Enums"]["guarantee_claim_status"]
          created_at: string | null
          id: string
          refund_amount_cents: number | null
          refund_issued_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          stripe_refund_id: string | null
          subscription_id: string
          subscription_year_end: string
          subscription_year_start: string
          updated_at: string | null
          user_id: string
          user_statement: string | null
        }
        Insert: {
          admin_notes?: string | null
          claim_status?: Database["public"]["Enums"]["guarantee_claim_status"]
          created_at?: string | null
          id?: string
          refund_amount_cents?: number | null
          refund_issued_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          stripe_refund_id?: string | null
          subscription_id: string
          subscription_year_end: string
          subscription_year_start: string
          updated_at?: string | null
          user_id: string
          user_statement?: string | null
        }
        Update: {
          admin_notes?: string | null
          claim_status?: Database["public"]["Enums"]["guarantee_claim_status"]
          created_at?: string | null
          id?: string
          refund_amount_cents?: number | null
          refund_issued_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          stripe_refund_id?: string | null
          subscription_id?: string
          subscription_year_end?: string
          subscription_year_start?: string
          updated_at?: string | null
          user_id?: string
          user_statement?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_guarantee_claims_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          booking_link: string
          created_at: string
          currency: string
          destination_id: string
          id: string
          outbound_date: string
          price: number
          return_date: string
          sent_at: string | null
          sent_to_subscribers: boolean
        }
        Insert: {
          booking_link: string
          created_at?: string
          currency?: string
          destination_id: string
          id?: string
          outbound_date: string
          price: number
          return_date: string
          sent_at?: string | null
          sent_to_subscribers?: boolean
        }
        Update: {
          booking_link?: string
          created_at?: string
          currency?: string
          destination_id?: string
          id?: string
          outbound_date?: string
          price?: number
          return_date?: string
          sent_at?: string | null
          sent_to_subscribers?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "deals_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          airport_code: string
          city_name: string
          country: string
          created_at: string
          id: string
          is_active: boolean
          priority: number
        }
        Insert: {
          airport_code: string
          city_name: string
          country: string
          created_at?: string
          id?: string
          is_active?: boolean
          priority: number
        }
        Update: {
          airport_code?: string
          city_name?: string
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: number
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          created_at: string
          email_data: Json
          email_type: string
          error_message: string | null
          id: string
          max_retries: number
          retry_count: number
          scheduled_for: string
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_data: Json
          email_type: string
          error_message?: string | null
          id?: string
          max_retries?: number
          retry_count?: number
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_data?: Json
          email_type?: string
          error_message?: string | null
          id?: string
          max_retries?: number
          retry_count?: number
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          all_time_low: number | null
          avg_90day_price: number | null
          booking_link: string | null
          dates: string
          deal_quality: string | null
          destination_id: string
          email_opened: boolean | null
          id: string
          link_clicked: boolean | null
          outbound_date: string | null
          price: number
          received_at: string
          return_date: string | null
          savings_percent: number | null
          sent_at: string | null
          sent_to_subscribers: boolean
          threshold_price: number | null
          tracking_threshold: number | null
          triggered_price: number | null
          user_id: string | null
        }
        Insert: {
          all_time_low?: number | null
          avg_90day_price?: number | null
          booking_link?: string | null
          dates: string
          deal_quality?: string | null
          destination_id: string
          email_opened?: boolean | null
          id?: string
          link_clicked?: boolean | null
          outbound_date?: string | null
          price: number
          received_at?: string
          return_date?: string | null
          savings_percent?: number | null
          sent_at?: string | null
          sent_to_subscribers?: boolean
          threshold_price?: number | null
          tracking_threshold?: number | null
          triggered_price?: number | null
          user_id?: string | null
        }
        Update: {
          all_time_low?: number | null
          avg_90day_price?: number | null
          booking_link?: string | null
          dates?: string
          deal_quality?: string | null
          destination_id?: string
          email_opened?: boolean | null
          id?: string
          link_clicked?: boolean | null
          outbound_date?: string | null
          price?: number
          received_at?: string
          return_date?: string | null
          savings_percent?: number | null
          sent_at?: string | null
          sent_to_subscribers?: boolean
          threshold_price?: number | null
          tracking_threshold?: number | null
          triggered_price?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_alerts_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          booking_link: string | null
          checked_at: string
          created_at: string
          destination_id: string
          flight_details: Json | null
          id: string
          outbound_date: string | null
          price: number
          price_source: string
          return_date: string | null
        }
        Insert: {
          booking_link?: string | null
          checked_at?: string
          created_at?: string
          destination_id: string
          flight_details?: Json | null
          id?: string
          outbound_date?: string | null
          price: number
          price_source?: string
          return_date?: string | null
        }
        Update: {
          booking_link?: string | null
          checked_at?: string
          created_at?: string
          destination_id?: string
          flight_details?: Json | null
          id?: string
          outbound_date?: string | null
          price?: number
          price_source?: string
          return_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      price_statistics: {
        Row: {
          all_time_high: number | null
          all_time_low: number | null
          avg_30day: number | null
          avg_7day: number | null
          avg_90day: number | null
          destination_id: string
          id: string
          last_calculated: string | null
          percentile_25: number | null
          percentile_50: number | null
          percentile_75: number | null
          std_deviation: number | null
          total_samples: number | null
        }
        Insert: {
          all_time_high?: number | null
          all_time_low?: number | null
          avg_30day?: number | null
          avg_7day?: number | null
          avg_90day?: number | null
          destination_id: string
          id?: string
          last_calculated?: string | null
          percentile_25?: number | null
          percentile_50?: number | null
          percentile_75?: number | null
          std_deviation?: number | null
          total_samples?: number | null
        }
        Update: {
          all_time_high?: number | null
          all_time_low?: number | null
          avg_30day?: number | null
          avg_7day?: number | null
          avg_90day?: number | null
          destination_id?: string
          id?: string
          last_calculated?: string | null
          percentile_25?: number | null
          percentile_50?: number | null
          percentile_75?: number | null
          std_deviation?: number | null
          total_samples?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "price_statistics_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: true
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      sent_emails: {
        Row: {
          click_rate: number | null
          deal_id: string
          id: string
          open_rate: number | null
          sent_at: string
          subject: string
          subscriber_count: number
        }
        Insert: {
          click_rate?: number | null
          deal_id: string
          id?: string
          open_rate?: number | null
          sent_at?: string
          subject: string
          subscriber_count: number
        }
        Update: {
          click_rate?: number | null
          deal_id?: string
          id?: string
          open_rate?: number | null
          sent_at?: string
          subject?: string
          subscriber_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "sent_emails_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          is_verified: boolean
          name: string
          subscribed_at: string
          updated_at: string
          verification_token: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          name: string
          subscribed_at?: string
          updated_at?: string
          verification_token?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          name?: string
          subscribed_at?: string
          updated_at?: string
          verification_token?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          plan_name: string
          plan_type: Database["public"]["Enums"]["subscription_plan_type"]
          price_cents: number
          stripe_price_id: string
          stripe_product_id: string
          trial_days: number | null
        }
        Insert: {
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          plan_name: string
          plan_type: Database["public"]["Enums"]["subscription_plan_type"]
          price_cents: number
          stripe_price_id: string
          stripe_product_id: string
          trial_days?: number | null
        }
        Update: {
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          plan_name?: string
          plan_type?: Database["public"]["Enums"]["subscription_plan_type"]
          price_cents?: number
          stripe_price_id?: string
          stripe_product_id?: string
          trial_days?: number | null
        }
        Relationships: []
      }
      user_destinations: {
        Row: {
          alert_cooldown_days: number
          alert_frequency: string | null
          created_at: string
          destination_id: string
          id: string
          is_active: boolean
          last_alert_sent_at: string | null
          min_deal_quality: string | null
          min_price_drop_percent: number | null
          price_threshold: number
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_cooldown_days?: number
          alert_frequency?: string | null
          created_at?: string
          destination_id: string
          id?: string
          is_active?: boolean
          last_alert_sent_at?: string | null
          min_deal_quality?: string | null
          min_price_drop_percent?: number | null
          price_threshold: number
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_cooldown_days?: number
          alert_frequency?: string | null
          created_at?: string
          destination_id?: string
          id?: string
          is_active?: boolean
          last_alert_sent_at?: string | null
          min_deal_quality?: string | null
          min_price_drop_percent?: number | null
          price_threshold?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_destinations_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          email_frequency: string
          email_notifications_enabled: boolean
          id: string
          last_login_at: string | null
          max_alerts_per_week: number | null
          quiet_hours_end: number | null
          quiet_hours_start: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_frequency?: string
          email_notifications_enabled?: boolean
          id?: string
          last_login_at?: string | null
          max_alerts_per_week?: number | null
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_frequency?: string
          email_notifications_enabled?: boolean
          id?: string
          last_login_at?: string | null
          max_alerts_per_week?: number | null
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          is_grandfathered: boolean | null
          plan_type:
            | Database["public"]["Enums"]["subscription_plan_type"]
            | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          is_grandfathered?: boolean | null
          plan_type?:
            | Database["public"]["Enums"]["subscription_plan_type"]
            | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          is_grandfathered?: boolean | null
          plan_type?:
            | Database["public"]["Enums"]["subscription_plan_type"]
            | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      create_password_reset_token: {
        Args: { p_user_id: string }
        Returns: string
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      queue_email: {
        Args: {
          p_email_data: Json
          p_email_type: string
          p_scheduled_for?: string
          p_user_id: string
        }
        Returns: string
      }
      refresh_price_statistics: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
      guarantee_claim_status: "pending" | "approved" | "rejected" | "refunded"
      subscription_plan_type: "monthly" | "annual" | "grandfathered"
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "unpaid"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      guarantee_claim_status: ["pending", "approved", "rejected", "refunded"],
      subscription_plan_type: ["monthly", "annual", "grandfathered"],
      subscription_status: [
        "active",
        "trialing",
        "past_due",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "unpaid",
      ],
    },
  },
} as const
