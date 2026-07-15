export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'developer' | 'tester' | 'admin';
export type JobStatus = 'draft' | 'active' | 'in_review' | 'completed' | 'cancelled';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type SubmissionStatus = 'draft' | 'submitted' | 'changes_requested' | 'approved' | 'rejected';
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';

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
      };
      jobs: {
        Row: {
          id: string;
          developer_id: string;
          title: string;
          app_url: string | null;
          category: string;
          package_key: string;
          total_amount_zar: number;
          testers_needed: number;
          status: JobStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          developer_id: string;
          title: string;
          app_url?: string | null;
          category: string;
          package_key: string;
          total_amount_zar: number;
          testers_needed: number;
          status?: JobStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      job_status: JobStatus;
      application_status: ApplicationStatus;
      submission_status: SubmissionStatus;
      payout_status: PayoutStatus;
    };
  };
};
