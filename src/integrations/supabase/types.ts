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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      account_provisions: {
        Row: {
          cohort_id: string | null
          consumed_at: string | null
          created_at: string
          created_by: string | null
          email: string
          full_name: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          cohort_id?: string | null
          consumed_at?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          full_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          cohort_id?: string | null
          consumed_at?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          full_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "account_provisions_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          badge_id: string
          earned_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          user_id?: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          user_id?: string
        }
        Relationships: []
      }
      activity_events: {
        Row: {
          created_at: string
          id: number
          lesson_id: string | null
          meta: Json
          sim_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          lesson_id?: string | null
          meta?: Json
          sim_id?: string | null
          type: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: never
          lesson_id?: string | null
          meta?: Json
          sim_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          body: string
          cohort_id: string | null
          created_by: string | null
          id: string
          published_at: string
          title: string
        }
        Insert: {
          body: string
          cohort_id?: string | null
          created_by?: string | null
          id?: string
          published_at?: string
          title: string
        }
        Update: {
          body?: string
          cohort_id?: string | null
          created_by?: string | null
          id?: string
          published_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      assignments: {
        Row: {
          assigned_by: string | null
          cohort_id: string | null
          created_at: string
          due_date: string | null
          id: string
          note: string | null
          target_id: string
          target_type: string
          user_id: string | null
        }
        Insert: {
          assigned_by?: string | null
          cohort_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          note?: string | null
          target_id: string
          target_type: string
          user_id?: string | null
        }
        Update: {
          assigned_by?: string | null
          cohort_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          note?: string | null
          target_id?: string
          target_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          lesson_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_questions: {
        Row: {
          blocked: boolean
          context: string | null
          created_at: string
          id: number
          lesson_id: string | null
          question: string
          user_id: string
        }
        Insert: {
          blocked?: boolean
          context?: string | null
          created_at?: string
          id?: never
          lesson_id?: string | null
          question: string
          user_id?: string
        }
        Update: {
          blocked?: boolean
          context?: string | null
          created_at?: string
          id?: never
          lesson_id?: string | null
          question?: string
          user_id?: string
        }
        Relationships: []
      }
      cohorts: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          start_date: string | null
          target_end_date: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          start_date?: string | null
          target_end_date?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          start_date?: string | null
          target_end_date?: string | null
        }
        Relationships: []
      }
      daily_activity: {
        Row: {
          day: string
          events: number
          reading_seconds: number
          user_id: string
        }
        Insert: {
          day: string
          events?: number
          reading_seconds?: number
          user_id?: string
        }
        Update: {
          day?: string
          events?: number
          reading_seconds?: number
          user_id?: string
        }
        Relationships: []
      }
      lesson_feedback: {
        Row: {
          comment: string | null
          helpful: boolean
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          helpful: boolean
          lesson_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          comment?: string | null
          helpful?: boolean
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_notes: {
        Row: {
          body: string
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          lesson_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          body?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          first_visited_at: string | null
          lesson_id: string
          max_scroll_pct: number
          time_spent_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          first_visited_at?: string | null
          lesson_id: string
          max_scroll_pct?: number
          time_spent_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          first_visited_at?: string | null
          lesson_id?: string
          max_scroll_pct?: number
          time_spent_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cohort_id: string | null
          comfort: Json
          created_at: string
          created_via: string
          email: string
          experience_level: string | null
          first_login_at: string | null
          full_name: string | null
          goals: string | null
          id: string
          last_active_at: string | null
          learning_path: Json | null
          must_change_password: boolean
          onboarding_completed_at: string | null
          recovery_code_saved_at: string | null
          resume: Json | null
          started_at: string | null
          status: string
          team: string | null
          timezone: string
          tour_completed_at: string | null
          weekly_minutes_goal: number | null
        }
        Insert: {
          cohort_id?: string | null
          comfort?: Json
          created_at?: string
          created_via?: string
          email: string
          experience_level?: string | null
          first_login_at?: string | null
          full_name?: string | null
          goals?: string | null
          id: string
          last_active_at?: string | null
          learning_path?: Json | null
          must_change_password?: boolean
          onboarding_completed_at?: string | null
          recovery_code_saved_at?: string | null
          resume?: Json | null
          started_at?: string | null
          status?: string
          team?: string | null
          timezone?: string
          tour_completed_at?: string | null
          weekly_minutes_goal?: number | null
        }
        Update: {
          cohort_id?: string | null
          comfort?: Json
          created_at?: string
          created_via?: string
          email?: string
          experience_level?: string | null
          first_login_at?: string | null
          full_name?: string | null
          goals?: string | null
          id?: string
          last_active_at?: string | null
          learning_path?: Json | null
          must_change_password?: boolean
          onboarding_completed_at?: string | null
          recovery_code_saved_at?: string | null
          resume?: Json | null
          started_at?: string | null
          status?: string
          team?: string | null
          timezone?: string
          tour_completed_at?: string | null
          weekly_minutes_goal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      recovery_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: number
          succeeded: boolean
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: never
          succeeded: boolean
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: never
          succeeded?: boolean
        }
        Relationships: []
      }
      recovery_codes: {
        Row: {
          code_hash: string
          created_at: string
          salt: string
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          salt: string
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          salt?: string
          user_id?: string
        }
        Relationships: []
      }
      self_checks: {
        Row: {
          lesson_id: string
          question_index: number
          rating: string
          updated_at: string
          user_id: string
        }
        Insert: {
          lesson_id: string
          question_index: number
          rating: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          lesson_id?: string
          question_index?: number
          rating?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      simulation_progress: {
        Row: {
          challenge_passed_at: string | null
          first_opened_at: string
          last_opened_at: string
          runs: number
          sim_id: string
          user_id: string
        }
        Insert: {
          challenge_passed_at?: string | null
          first_opened_at?: string
          last_opened_at?: string
          runs?: number
          sim_id: string
          user_id?: string
        }
        Update: {
          challenge_passed_at?: string | null
          first_opened_at?: string
          last_opened_at?: string
          runs?: number
          sim_id?: string
          user_id?: string
        }
        Relationships: []
      }
      team_doubts: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data: Json
          id: string
          session_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_sessions: {
        Row: {
          data: Json
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          data: Json
          id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          data?: Json
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_lesson_time: {
        Args: { p_lesson_id: string; p_scroll_pct?: number; p_seconds: number }
        Returns: undefined
      }
      admin_daily_activity: {
        Args: { p_days?: number }
        Returns: {
          active_users: number
          chat_questions: number
          day: string
          lessons_completed: number
          reading_minutes: number
          signups: number
          sims_passed: number
        }[]
      }
      admin_lesson_stats: {
        Args: never
        Returns: {
          avg_seconds: number
          chat_questions: number
          comments: number
          completers: number
          got_it: number
          helpful_no: number
          helpful_yes: number
          lesson_id: string
          missed: number
          partly: number
          viewers: number
        }[]
      }
      admin_reset_progress: { Args: { p_user: string }; Returns: undefined }
      admin_set_cohort: {
        Args: { p_cohort: string; p_users: string[] }
        Returns: undefined
      }
      admin_set_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user: string
        }
        Returns: undefined
      }
      admin_sim_stats: {
        Args: never
        Returns: {
          openers: number
          passers: number
          sim_id: string
          total_runs: number
        }[]
      }
      admin_update_profile: {
        Args: { p_full_name: string; p_team: string; p_user: string }
        Returns: undefined
      }
      admin_users: {
        Args: never
        Returns: {
          active_days_14: number
          badges: number
          cohort_id: string
          completed_lessons: string[]
          created_at: string
          created_via: string
          email: string
          first_login_at: string
          full_name: string
          got_it: number
          id: string
          last_active_at: string
          missed: number
          must_change_password: boolean
          onboarding_completed_at: string
          partly: number
          reading_seconds_7: number
          role: Database["public"]["Enums"]["app_role"]
          sims_opened: number
          sims_passed: number
          status: string
          team: string
          time_spent_seconds: number
          visited_lessons: number
          weekly_minutes_goal: number
        }[]
      }
      assert_admin: { Args: never; Returns: undefined }
      can_self_register: { Args: { p_email: string }; Returns: boolean }
      confirm_recovery_code_saved: { Args: never; Returns: undefined }
      consume_recovery_code: {
        Args: { p_code: string; p_email: string }
        Returns: string
      }
      generate_recovery_code: { Args: never; Returns: string }
      hash_recovery_code: {
        Args: { p_code: string; p_salt: string }
        Returns: string
      }
      is_admin: { Args: never; Returns: boolean }
      local_today: { Args: { p_user: string }; Returns: string }
      mark_password_changed: { Args: never; Returns: undefined }
      my_cohort_id: { Args: never; Returns: string }
      record_sim_open: { Args: { p_sim_id: string }; Returns: undefined }
      record_sim_pass: { Args: { p_sim_id: string }; Returns: undefined }
      regenerate_recovery_code: { Args: never; Returns: string }
      request_password_help: {
        Args: { p_email: string; p_note?: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "learner"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "learner"],
    },
  },
} as const
