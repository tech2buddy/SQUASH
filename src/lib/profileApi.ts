import { hasExpectedFileSignature, type SafeFileKind } from './fileValidation';
import { isSupabaseConfigured, supabase, SERVICE_UNAVAILABLE_MESSAGE } from './supabase';
import { formatPersonName } from './displayText';

export type TesterProfileSettings = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  preferredPayout: 'eft' | 'snapscan' | 'airtime';
  isPublic: boolean;
};

export type TesterPublicProfile = TesterProfileSettings & {
  avatarUrl: string | null;
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
    .select('full_name, email, phone, city, avatar_url')
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
    avatarUrl: profile.avatar_url || null,
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
  if (!isSupabaseConfigured) throw new Error(SERVICE_UNAVAILABLE_MESSAGE);

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


export async function uploadTesterProfilePhoto(userId: string, file: File): Promise<string> {
  if (!isSupabaseConfigured) throw new Error(SERVICE_UNAVAILABLE_MESSAGE);
  const allowedTypes: Record<string, { kind: SafeFileKind; extension: string }> = {
    'image/png': { kind: 'png', extension: 'png' },
    'image/jpeg': { kind: 'jpg', extension: 'jpg' },
    'image/webp': { kind: 'webp', extension: 'webp' },
  };
  const allowed = allowedTypes[file.type];
  if (!allowed || !(await hasExpectedFileSignature(file, allowed.kind))) {
    throw new Error('Upload a valid PNG, JPEG or WebP profile photo.');
  }
  if (file.size > 2 * 1024 * 1024) throw new Error('Profile photos must be 2 MB or smaller.');

  const filePath = `${userId}/avatar-${crypto.randomUUID()}.${allowed.extension}`;
  const { error: uploadError } = await supabase.storage
    .from('profile-avatars')
    .upload(filePath, file, { cacheControl: '31536000', upsert: false });
  if (uploadError) throw new Error(`Could not upload profile photo: ${uploadError.message}`);

  const { data: publicUrlData } = supabase.storage.from('profile-avatars').getPublicUrl(filePath);
  const avatarUrl = publicUrlData.publicUrl;
  const { data: currentProfile } = await supabase.from('profiles').select('avatar_url').eq('id', userId).maybeSingle();
  const { error: updateError } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId);
  if (updateError) {
    await supabase.storage.from('profile-avatars').remove([filePath]);
    throw new Error(`Could not save profile photo: ${updateError.message}`);
  }

  const previousUrl = currentProfile?.avatar_url || '';
  const marker = '/storage/v1/object/public/profile-avatars/';
  const markerIndex = previousUrl.indexOf(marker);
  if (markerIndex >= 0) {
    const previousPath = decodeURIComponent(previousUrl.slice(markerIndex + marker.length));
    if (previousPath.startsWith(`${userId}/`) && previousPath !== filePath) {
      await supabase.storage.from('profile-avatars').remove([previousPath]);
    }
  }
  return avatarUrl;
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
  if (!isSupabaseConfigured) throw new Error(SERVICE_UNAVAILABLE_MESSAGE);

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
  if (!isSupabaseConfigured) throw new Error(SERVICE_UNAVAILABLE_MESSAGE);

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

/**
 * Reads the `tester_leaderboard` view rather than `tester_profiles`.
 *
 * Phase 57 removed the "any listed profile is readable by anyone" branch from
 * that table -- it was letting any signed-in tester read every other tester's
 * balance, strikes and probation notes. The view is the sanctioned path for
 * cross-tester reputation: a fixed, curated column set with nothing sensitive
 * in it, and it computes rank, tier and quality score in SQL rather than
 * approximating them here.
 *
 * The previous query also joined `profiles!inner`, which no ordinary tester has
 * ever been allowed to read for other users -- so this was returning a
 * "leaderboard" of at most the caller themselves.
 */
export async function getTesterLeaderboard(): Promise<TesterLeaderboardEntry[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await (supabase.from('tester_leaderboard') as any)
    .select('rank, full_name, city, rating, tests_completed, approval_rate, approved_tests, quality_score, tier')
    .order('rank', { ascending: true })
    .limit(10);

  if (error) throw error;

  return ((data || []) as Array<{
    rank: number;
    full_name: string | null;
    city: string | null;
    rating: number | null;
    tests_completed: number | null;
    approval_rate: number | null;
    approved_tests: number | null;
    quality_score: number | null;
    tier: string | null;
  }>).map((row) => ({
    rank: row.rank,
    name: formatPersonName(row.full_name || 'Anonymous Tester'),
    city: row.city || 'South Africa',
    rating: row.rating || 0,
    testsCompleted: row.tests_completed || 0,
    approvedTests: row.approved_tests || 0,
    approvalRate: row.approval_rate || 0,
    score: row.quality_score || 0,
    specialty: row.tier || 'new',
  }));
}

/** Mirrors the `referral_status` enum defined in phase 12. */
export type TesterReferralStatus =
  | 'invited'
  | 'signed_up'
  | 'approved_work'
  | 'reward_ready'
  | 'rewarded'
  | 'cancelled';

export type TesterReferralEntry = {
  id: string;
  name: string;
  email: string;
  status: TesterReferralStatus;
  detail: string;
  date: string;
  rewardZar: number | null;
};

const REFERRAL_DETAIL: Record<TesterReferralStatus, string> = {
  invited: 'Invite sent — waiting for signup',
  signed_up: 'Signed up — waiting for their first approved test',
  approved_work: 'Completing their first test',
  reward_ready: 'First test approved',
  rewarded: 'Reward paid',
  cancelled: 'Cancelled',
};

/**
 * Real referral records (supabase/phase53_tester_referrals.sql).
 *
 * This page previously rendered mock data under a literal "TODO" subtitle and
 * an invite button that only pushed a row into React state.
 *
 * `reward_ready` means the referred tester has had a submission approved — it
 * does not mean money is owed. The reward amount is deliberately unset in the
 * migration; see the note there before wiring this to payouts.
 */
export async function getTesterReferrals(userId: string): Promise<TesterReferralEntry[]> {
  if (!isSupabaseConfigured || !userId) return [];

  const { data, error } = await (supabase.rpc as any)('get_tester_referrals');
  if (error) throw new Error(error.message || 'Unable to load your referrals right now.');

  return ((data || []) as Array<{
    id: string;
    referred_email: string;
    referred_name: string | null;
    status: TesterReferralStatus;
    invited_at: string;
    signed_up_at: string | null;
    reward_ready_at: string | null;
    reward_amount_zar: number | null;
  }>).map((row) => ({
    id: row.id,
    // Only known once they actually sign up; an unaccepted invite is just an
    // address, and inventing a name for it would be a lie on the tester's page.
    name: row.referred_name || 'Pending signup',
    email: row.referred_email,
    status: row.status,
    detail: REFERRAL_DETAIL[row.status] ?? '',
    date: row.reward_ready_at || row.signed_up_at || row.invited_at,
    rewardZar: row.reward_amount_zar,
  }));
}

/** The tester's shareable code, generated on first use. */
export async function getReferralCode(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await (supabase.rpc as any)('get_or_create_referral_code');
  if (error) return null;
  return typeof data === 'string' ? data : null;
}

/**
 * Records an invite.
 *
 * Inserted directly rather than through an RPC because phase 12 already grants
 * exactly this: `tester_referrals_insert_own` permits a tester to write their
 * own row provided it starts at 'invited' with no reward attached. Phase 53's
 * trigger applies the daily cap and rejects addresses that already have an
 * account, so the ceiling is enforced server-side either way.
 */
export async function inviteTesterReferral(email: string): Promise<TesterReferralEntry> {
  if (!isSupabaseConfigured) throw new Error(SERVICE_UNAVAILABLE_MESSAGE);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Please log in again before sending an invite.');

  // The row carries the code it was issued under, so a later code rotation
  // does not rewrite the history of who was invited with what.
  const code = await getReferralCode();
  if (!code) throw new Error('Your referral code is not ready yet. Try again in a moment.');

  const { data, error } = await (supabase.from('tester_referrals') as any)
    .insert({
      referrer_id: user.id,
      // A check constraint requires this to already be lowercased.
      referred_email: email.trim().toLowerCase(),
      referral_code: code,
      status: 'invited',
    })
    .select('id, referred_email, status, created_at')
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('You have already invited that person.');
    throw new Error(error.message || 'Unable to save that invite right now.');
  }

  const row = data as {
    id: string;
    referred_email: string;
    status: TesterReferralStatus;
    created_at: string;
  };
  return {
    id: row.id,
    name: 'Pending signup',
    email: row.referred_email,
    status: row.status,
    detail: REFERRAL_DETAIL[row.status] ?? '',
    date: row.created_at,
    rewardZar: null,
  };
}

/**
 * Links a newly created account to whoever referred it. Called once, just after
 * signup. Returns false when the code is unknown, self-referring, or the
 * account is already credited — none of which are errors worth interrupting
 * signup for.
 */
export async function claimReferral(code: string): Promise<boolean> {
  if (!isSupabaseConfigured || !code.trim()) return false;

  const { data, error } = await (supabase.rpc as any)('claim_tester_referral', { p_code: code });
  if (error) return false;
  return data === true;
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
  if (!isSupabaseConfigured) throw new Error(SERVICE_UNAVAILABLE_MESSAGE);

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
    name: formatPersonName(t.profiles.full_name || 'Anonymous'),
    level: '', // Will be computed in the component using getTesterTier
    testsCompleted: t.tests_completed || 0,
    rating: Number(t.rating) || 0,
  }));
}
