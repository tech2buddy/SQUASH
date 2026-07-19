export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'developer' | 'tester' | 'admin';
export type JobStatus = 'draft' | 'active' | 'in_review' | 'completed' | 'cancelled';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type AssignmentStatus = 'active' | 'submitted' | 'approved' | 'cancelled';
export type SubmissionStatus = 'draft' | 'submitted' | 'changes_requested' | 'approved' | 'rejected';
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';
export type PolicyStatus = 'draft' | 'published' | 'archived';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          email: string;
          avatar_url: string | null;
          phone: string | null;
          city: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: UserRole;
          full_name: string;
          email: string;
          avatar_url?: string | null;
          phone?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['profiles']['Insert'], 'id'>>;
        Relationships: [];
      };
      developer_profiles: {
        Row: {
          user_id: string;
          company_name: string | null;
          website_url: string | null;
          billing_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          company_name?: string | null;
          website_url?: string | null;
          billing_email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['developer_profiles']['Insert'], 'user_id'>>;
        Relationships: [];
      };
      tester_profiles: {
        Row: {
          user_id: string;
          bio: string | null;
          rating: number;
          tests_completed: number;
          approval_rate: number;
          available_balance_zar: number;
          preferred_payout_method: 'eft' | 'snapscan' | 'airtime';
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          bio?: string | null;
          rating?: number;
          tests_completed?: number;
          approval_rate?: number;
          available_balance_zar?: number;
          preferred_payout_method?: 'eft' | 'snapscan' | 'airtime';
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['tester_profiles']['Insert'], 'user_id'>>;
        Relationships: [];
      };
      tester_specializations: {
        Row: {
          id: string;
          tester_id: string;
          specialization_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tester_id: string;
          specialization_key: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tester_specializations']['Insert']>;
        Relationships: [];
      };
      job_applications: {
        Row: {
          id: string;
          job_id: string;
          tester_id: string;
          status: ApplicationStatus;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          tester_id: string;
          status?: ApplicationStatus;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['job_applications']['Insert']>;
        Relationships: [];
      };
      test_assignments: {
        Row: {
          id: string;
          job_id: string;
          tester_id: string;
          application_id: string | null;
          status: AssignmentStatus;
          due_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          tester_id: string;
          application_id?: string | null;
          status?: AssignmentStatus;
          due_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['test_assignments']['Insert']>;
        Relationships: [];
      };
      test_submissions: {
        Row: {
          id: string;
          assignment_id: string;
          tester_id: string;
          job_id: string;
          status: SubmissionStatus;
          summary: string | null;
          usability_score: number | null;
          performance_score: number | null;
          onboarding_score: number | null;
          bug_severity_score: number | null;
          device_compatibility_score: number | null;
          submitted_at: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          tester_id: string;
          job_id: string;
          status?: SubmissionStatus;
          summary?: string | null;
          usability_score?: number | null;
          performance_score?: number | null;
          onboarding_score?: number | null;
          bug_severity_score?: number | null;
          device_compatibility_score?: number | null;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['test_submissions']['Insert']>;
        Relationships: [];
      };
      bug_reports: {
        Row: {
          id: string;
          submission_id: string | null;
          assignment_id: string;
          tester_id: string;
          job_id: string;
          title: string;
          description: string;
          severity: 'Low' | 'Medium' | 'High' | 'Critical';
          steps_to_reproduce: string | null;
          expected_result: string | null;
          actual_result: string | null;
          screenshot_path: string | null;
          video_path: string | null;
          video_duration_seconds: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          submission_id?: string | null;
          assignment_id: string;
          tester_id: string;
          job_id: string;
          title: string;
          description: string;
          severity: 'Low' | 'Medium' | 'High' | 'Critical';
          steps_to_reproduce?: string | null;
          expected_result?: string | null;
          actual_result?: string | null;
          screenshot_path?: string | null;
          video_path?: string | null;
          video_duration_seconds?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['bug_reports']['Insert']>;
        Relationships: [];
      };
      payout_methods: {
        Row: {
          id: string;
          tester_id: string;
          method_type: 'eft' | 'snapscan' | 'airtime';
          label: string;
          masked_details: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tester_id: string;
          method_type: 'eft' | 'snapscan' | 'airtime';
          label: string;
          masked_details: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['payout_methods']['Insert']>;
        Relationships: [];
      };
      payouts: {
        Row: {
          id: string;
          tester_id: string;
          payout_method_id: string | null;
          amount_zar: number;
          status: PayoutStatus;
          admin_note: string | null;
          payout_reference: string | null;
          processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tester_id: string;
          payout_method_id?: string | null;
          amount_zar: number;
          status?: PayoutStatus;
          admin_note?: string | null;
          payout_reference?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['payouts']['Insert']>;
        Relationships: [];
      };
      admin_activity_logs: {
        Row: {
          id: string;
          admin_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          note: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          note?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['admin_activity_logs']['Insert']>;
        Relationships: [];
      };
      policies: {
        Row: {
          id: string;
          slug: string;
          title: string;
          content: string;
          status: PolicyStatus;
          version: string;
          effective_date: string | null;
          published_at: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          content?: string;
          status?: PolicyStatus;
          version?: string;
          effective_date?: string | null;
          published_at?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['policies']['Insert']>;
        Relationships: [];
      };      jobs: {
        Row: {
          id: string;
          developer_id: string;
          title: string;
          app_url: string | null;
          logo_url: string | null;
          platform: string;
          category: string;
          package_key: 'starter' | 'growth' | 'pro' | 'enterprise';
          total_amount_zar: number;
          testers_needed: number;
          description: string | null;
          tasks: string | null;
          focus_areas: string | null;
          preferred_specializations: string[];
          live_session_enabled: boolean;
          live_session_at: string | null;
          status: JobStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          developer_id: string;
          title: string;
          app_url?: string | null;
          logo_url?: string | null;
          platform: string;
          category: string;
          package_key: 'starter' | 'growth' | 'pro' | 'enterprise';
          total_amount_zar: number;
          testers_needed: number;
          description?: string | null;
          tasks?: string | null;
          focus_areas?: string | null;
          preferred_specializations?: string[];
          live_session_enabled?: boolean;
          live_session_at?: string | null;
          status?: JobStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      job_status: JobStatus;
      application_status: ApplicationStatus;
      assignment_status: AssignmentStatus;
      submission_status: SubmissionStatus;
      payout_status: PayoutStatus;
      policy_status: PolicyStatus;
    };
  };
};
