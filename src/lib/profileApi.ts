import { isSupabaseConfigured, supabase } from './supabase';

export type TesterProfileSettings = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  preferredPayout: 'eft' | 'snapscan' | 'airtime';
  isPublic: boolean;
};

export type TesterPublicProfile = TesterProfileSettings & {
  bio: string;
  rating: number;
  testsCompleted: number;
  approvalRate: number;
  availableBalanceZar: number;
};

export async function getTesterProfile(userId: string): Promise<TesterPublicProfile | null> {
  if (!isSupabaseConfigured) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, email, phone, city')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) return null;

  const { data: testerProfile, error: testerError } = await supabase
    .from('tester_profiles')
    .select('bio, rating, tests_completed, approval_rate, available_balance_zar, preferred_payout_method, is_public')
    .eq('user_id', userId)
    .maybeSingle();

  if (testerError) throw testerError;

  return {
    fullName: profile.full_name,
    email: profile.email,
    phone: profile.phone || '',
    city: profile.city || '',
    preferredPayout: testerProfile?.preferred_payout_method || 'eft',
    isPublic: testerProfile?.is_public ?? true,
    bio: testerProfile?.bio || '',
    rating: Number(testerProfile?.rating || 0),
    testsCompleted: testerProfile?.tests_completed || 0,
    approvalRate: testerProfile?.approval_rate || 0,
    availableBalanceZar: testerProfile?.available_balance_zar || 0,
  };
}

export async function updateTesterProfile(userId: string, values: TesterProfileSettings) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: values.fullName.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim() || null,
      city: values.city.trim() || null,
    })
    .eq('id', userId);

  if (profileError) throw profileError;

  const { error: testerError } = await supabase
    .from('tester_profiles')
    .upsert({
      user_id: userId,
      preferred_payout_method: values.preferredPayout,
      is_public: values.isPublic,
    });

  if (testerError) throw testerError;
}

export async function getTesterSpecializations(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('tester_specializations')
    .select('specialization_key')
    .eq('tester_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map((row) => row.specialization_key);
}

export async function replaceTesterSpecializations(userId: string, specializationKeys: string[]) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');

  const uniqueKeys = Array.from(new Set(specializationKeys));
  const { error: deleteError } = await supabase
    .from('tester_specializations')
    .delete()
    .eq('tester_id', userId);

  if (deleteError) throw deleteError;
  if (uniqueKeys.length === 0) return;

  const { error: insertError } = await supabase.from('tester_specializations').insert(
    uniqueKeys.map((specializationKey) => ({
      tester_id: userId,
      specialization_key: specializationKey,
    })),
  );

  if (insertError) throw insertError;
}

export type DeveloperProfileSettings = {
  developerType: 'company' | 'individual';
  fullName: string;
  nickname: string;
  companyName: string;
  websiteUrl: string;
  billingEmail: string;
};

export async function getDeveloperProfile(userId: string): Promise<DeveloperProfileSettings | null> {
  if (!isSupabaseConfigured) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) throw profileError;

  const { data: rawData, error } = await supabase
    .from('developer_profiles')
    .select('company_name, website_url, billing_email, developer_type, nickname')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!rawData) return null;

  const data = rawData as any;

  return {
    developerType: (data.developer_type as 'company' | 'individual') || 'company',
    fullName: profile?.full_name || '',
    nickname: data.nickname || '',
    companyName: data.company_name || '',
    websiteUrl: data.website_url || '',
    billingEmail: data.billing_email || '',
  };
}

export async function updateDeveloperProfile(userId: string, values: DeveloperProfileSettings) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: values.fullName.trim() })
    .eq('id', userId);

  if (profileError) throw profileError;

  const { error } = await supabase.from('developer_profiles').upsert({
    user_id: userId,
    developer_type: values.developerType,
    nickname: values.nickname.trim() || null,
    company_name: values.companyName.trim() || null,
    website_url: values.websiteUrl.trim() || null,
    billing_email: values.billingEmail.trim().toLowerCase() || null,
  } as any);

  if (error) throw error;
}


export type TesterLeaderboardEntry = {
  rank: number;
  name: string;
  city: string;
  rating: number;
  testsCompleted: number;
  approvedTests: number;
  approvalRate: number;
  score: number;
  specialty: string;
};

export async function getTesterLeaderboard(): Promise<TesterLeaderboardEntry[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('tester_profiles')
    .select('rating, tests_completed, approval_rate, profiles!inner(full_name)')
    .order('rating', { ascending: false })
    .order('tests_completed', { ascending: false })
    .limit(10);

  if (error) throw error;

  return (data || []).map((row: any, index: number) => {
    const testsCompleted = row.tests_completed || 0;
    const rating = row.rating || 0;
    return {
      rank: index + 1,
      name: row.profiles?.full_name || 'Anonymous Tester',
      city: row.profiles?.city || 'South Africa',
      rating,
      testsCompleted,
      approvedTests: testsCompleted,
      approvalRate: row.approval_rate || 0,
      score: Math.round(testsCompleted * 12 + rating * 80),
      specialty: 'Testing',
    };
  });
}

export type TesterReferralEntry = {
  name: string;
  email: string;
  status: 'invited' | 'signed_up' | 'approved_work' | 'reward_ready' | 'pending' | 'completed';
  detail: string;
  date: string;
};

export async function getTesterReferrals(_userId: string): Promise<TesterReferralEntry[]> {
  // TODO: Implement actual referrals table in Supabase
  return [];
}

export type UserSettings = {
  toggles: Record<string, boolean>;
  availableDays: string[];
  preferredTime: string;
};

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('user_settings')
    .select('toggles, available_days, preferred_time')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    toggles: (data.toggles as Record<string, boolean>) || {},
    availableDays: (data.available_days as string[]) || [],
    preferredTime: data.preferred_time || '',
  };
}

export async function updateUserSettings(userId: string, settings: UserSettings) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');

  const { error } = await supabase.from('user_settings').upsert({
    user_id: userId,
    toggles: settings.toggles,
    available_days: settings.availableDays,
    preferred_time: settings.preferredTime,
  });

  if (error) throw error;
}

export type TopTesterDisplay = {
  name: string;
  level: string; // The tier label e.g., 'Pro Tester'
  testsCompleted: number;
  rating: number;
};

export async function getTopTesters(limit = 3): Promise<TopTesterDisplay[]> {
  if (!isSupabaseConfigured) return [];

  // Query tester_profiles, order by rating and tests completed
  const { data, error } = await supabase
    .from('tester_profiles')
    .select(`
      rating,
      tests_completed,
      profiles!inner (
        full_name
      )
    `)
    .eq('is_public', true) // Only show public profiles
    .order('rating', { ascending: false })
    .order('tests_completed', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch top testers:', error);
    return [];
  }

  // Map to the display format expected by the UI. 
  return data.map((t: any) => ({
    name: t.profiles.full_name || 'Anonymous',
    level: '', // Will be computed in the component using getTesterTier
    testsCompleted: t.tests_completed || 0,
    rating: Number(t.rating) || 0,
  }));
}

