import { supabase, SERVICE_UNAVAILABLE_MESSAGE } from './supabase';

export type ProbationStatus = 'active' | 'extended' | 'cleared' | 'restricted' | 'not_applicable';
export type ProbationDecision = 'cleared' | 'extended' | 'restricted';

export type AdminProbationTester = {
  testerId: string;
  name: string;
  email: string;
  status: Extract<ProbationStatus, 'active' | 'extended'>;
  startedAt: string | null;
  endsAt: string | null;
  testsCompleted: number;
  rating: number;
};

export async function getAdminProbationTesters(): Promise<AdminProbationTester[]> {
  const { data: testerRows, error } = await (supabase.from('tester_profiles') as any)
    .select('user_id, probation_status, qualification_probation_started_at, qualification_probation_ends_at, tests_completed, rating')
    .in('probation_status', ['active', 'extended'])
    .order('qualification_probation_ends_at', { ascending: true });
  if (error) throw new Error(error.message || SERVICE_UNAVAILABLE_MESSAGE);
  if (!testerRows?.length) return [];

  const ids = testerRows.map((row: any) => row.user_id);
  const { data: profiles, error: profileError } = await supabase.from('profiles').select('id, full_name, email').in('id', ids);
  if (profileError) throw new Error(profileError.message || SERVICE_UNAVAILABLE_MESSAGE);
  const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));
  return testerRows.map((row: any) => {
    const profile = profileById.get(row.user_id);
    return {
      testerId: row.user_id,
      name: profile?.full_name || 'Tester',
      email: profile?.email || 'Email unavailable',
      status: row.probation_status,
      startedAt: row.qualification_probation_started_at || null,
      endsAt: row.qualification_probation_ends_at || null,
      testsCompleted: Number(row.tests_completed || 0),
      rating: Number(row.rating || 0),
    };
  });
}

export async function reviewTesterProbation(input: { testerId: string; decision: ProbationDecision; note: string; extensionDays?: number }) {
  const { data, error } = await (supabase.rpc as any)('review_tester_probation', {
    p_tester_id: input.testerId,
    p_decision: input.decision,
    p_note: input.note.trim(),
    p_extension_days: input.extensionDays || 30,
  });
  if (error) throw new Error(error.message || SERVICE_UNAVAILABLE_MESSAGE);
  return data;
}
