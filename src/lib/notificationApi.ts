import { isSupabaseConfigured, supabase, SERVICE_UNAVAILABLE_MESSAGE } from './supabase';

export type NotificationType = 'job' | 'application' | 'report' | 'payout' | 'security';

export type NotificationPreferenceKey = 'newInvites' | 'approvalUpdates' | 'payoutAlerts' | 'changesRequested';

// Checks the user's saved notification toggle before sending. Defaults to
// true (send it) if the user has no settings row yet or the key is unset,
// matching the default-on state new users see in Settings.
//
// This calls the user_wants_notification() SQL function (security definer)
// rather than querying user_settings directly -- RLS on that table only
// allows a user to read their own row, but this check is very often run
// from someone else's session (e.g. a developer approving a tester's
// report), so a direct client-side select would always be blocked and
// silently fall back to "send it" instead of actually respecting the
// tester's preference.
async function userWantsNotification(userId: string, preferenceKey: NotificationPreferenceKey): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  const { data, error } = await (supabase.rpc as any)('user_wants_notification', {
    p_user_id: userId,
    p_key: preferenceKey,
  });
  if (error) return true;
  return data !== false;
}

export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  linkPath: string;
  status: 'unread' | 'read';
  createdAt: string;
  readAt: string | null;
};


export async function getUserNotifications(userId: string): Promise<AppNotification[]> {
  if (!userId || !isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message || 'Unable to load notifications.');

  return (data || []).map((item: any) => ({
    id: item.id,
    userId: item.user_id,
    title: item.title,
    body: item.body || item.description || '',
    // notify_user stores the client's 'job' type as 'job_match', which is
    // what the column's check constraint allows. Map it back so the UI sees
    // the type it wrote.
    type: (item.notification_type === 'job_match'
      ? 'job'
      : item.notification_type || item.type || 'job') as NotificationType,
    linkPath: item.link_path || item.href || '/dashboard',
    status: item.status === 'read' ? 'read' : 'unread',
    createdAt: item.created_at,
    readAt: item.read_at || null,
  }));
}

export async function requestBrowserPushPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      triggerBrowserPushNotification('SQUASH Notifications Enabled 🚀', {
        body: 'You will receive real-time push alerts when testers apply or submit bug reports.',
      });
    }
    return permission;
  } catch (err) {
    console.warn('Push permission request error:', err);
    return 'denied';
  }
}

export function triggerBrowserPushNotification(
  title: string,
  options?: {
    body?: string;
    linkPath?: string;
    icon?: string;
    tag?: string;
  }
) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notification = new Notification(title, {
      body: options?.body || 'New activity on your SQUASH workspace.',
      icon: options?.icon || '/squash-logo.png',
      badge: '/squash-logo.png',
      tag: options?.tag || `squash_push_${Date.now()}`,
      silent: false,
    });

    if (options?.linkPath) {
      notification.onclick = (e) => {
        e.preventDefault();
        window.focus();
        window.location.href = options.linkPath!;
        notification.close();
      };
    }
  } catch (err) {
    console.warn('Error triggering browser push notification:', err);
  }
}

export async function createNotification(input: {
  userId: string;
  title: string;
  body: string;
  type?: NotificationType;
  linkPath?: string;
  status?: 'read' | 'unread';
  createdAt?: string;
  preferenceKey?: NotificationPreferenceKey;
}): Promise<AppNotification | null> {
  const now = input.createdAt || new Date().toISOString();
  const status = input.status || 'unread';
  const readAt = status === 'read' ? now : null;

  if (!isSupabaseConfigured) throw new Error(SERVICE_UNAVAILABLE_MESSAGE);

  if (input.preferenceKey && !(await userWantsNotification(input.userId, input.preferenceKey))) {
    return null;
  }

  // Goes through notify_user (security definer) rather than inserting
  // directly. The only INSERT policy on notifications is admin-only, so
  // every developer/tester-triggered notification was silently rejected by
  // RLS. The RPC verifies the two users share a job before writing, and
  // lets the id column default to gen_random_uuid() -- the client used to
  // pass a "notif_<ts>_<rand>" string into a uuid column, which failed with
  // "invalid input syntax for type uuid".
  const { data: newId, error } = await (supabase.rpc as any)('notify_user', {
    p_user_id: input.userId,
    p_title: input.title,
    p_body: input.body,
    p_type: input.type || 'general',
    p_link_path: input.linkPath || '/dashboard',
  });
  if (error) throw new Error(error.message || 'Unable to create notification.');

  const newNotification: AppNotification = {
    id: String(newId),
    userId: input.userId,
    title: input.title,
    body: input.body,
    type: input.type || 'job',
    linkPath: input.linkPath || '/dashboard',
    status,
    createdAt: now,
    readAt,
  };

  if (status === 'unread') {
    window.dispatchEvent(new CustomEvent('squash_notification_updated', { detail: { userId: input.userId, notification: newNotification } }));
    triggerBrowserPushNotification(input.title, {
      body: input.body,
      linkPath: input.linkPath,
    });
  }

  return newNotification;
}

export async function markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
  if (!userId || !isSupabaseConfigured) return;
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('notifications' as any)
    .update({ status: 'read', read_at: now } as any)
    .eq('id', notificationId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message || 'Unable to mark notification as read.');

  window.dispatchEvent(new CustomEvent('squash_notification_updated', { detail: { userId } }));
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  if (!userId || !isSupabaseConfigured) return;
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('notifications' as any)
    .update({ status: 'read', read_at: now } as any)
    .eq('user_id', userId);
  if (error) throw new Error(error.message || 'Unable to mark notifications as read.');

  window.dispatchEvent(new CustomEvent('squash_notification_updated', { detail: { userId } }));
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const notifications = await getUserNotifications(userId);
  return notifications.filter((n) => n.status === 'unread').length;
}

const backfilledDevelopers = new Set<string>();

export async function backfillDeveloperNotifications(developerId: string): Promise<void> {
  if (!developerId || !isSupabaseConfigured) return;

  if (backfilledDevelopers.has(developerId)) return;
  backfilledDevelopers.add(developerId);

  try {
    // Get existing notifications to avoid duplicates
    const existing = await getUserNotifications(developerId);
    const existingLinks = new Set(existing.map((n) => n.linkPath));

    // Fetch developer's jobs
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, title, developer_id')
      .eq('developer_id', developerId);

    if (!jobs || jobs.length === 0) return;

    const jobIds = jobs.map((j) => j.id);
    const jobMap = new Map(jobs.map((j) => [j.id, j]));

    // Fetch all submissions and applications for those jobs
    const [{ data: submissions }, { data: applications }] = await Promise.all([
      supabase.from('test_submissions').select('id, job_id, tester_id, created_at').in('job_id', jobIds).order('created_at', { ascending: false }),
      supabase.from('job_applications').select('id, job_id, tester_id, created_at').in('job_id', jobIds).order('created_at', { ascending: false }),
    ]);

    // Fetch tester names
    const testerIds = Array.from(new Set([
      ...(submissions || []).map((s) => s.tester_id),
      ...(applications || []).map((a) => a.tester_id),
    ]));

    const { data: profiles } = testerIds.length > 0
      ? await supabase.from('profiles').select('id, full_name').in('id', testerIds)
      : { data: [] };

    const nameMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name as string]));

    // Backfill submission notifications (read)
    for (const submission of (submissions || [])) {
      const linkPath = `/report-details?submission=${submission.id}`;
      if (existingLinks.has(linkPath)) continue;
      const job = jobMap.get(submission.job_id);
      const testerName = nameMap.get(submission.tester_id) || 'A tester';
      await createNotification({
        userId: developerId,
        title: 'Test Report Submitted',
        body: `${testerName} submitted a test report for ${job?.title || 'your app'}.`,
        type: 'report',
        linkPath,
        status: 'read',
        createdAt: submission.created_at,
      });
    }

    // Backfill application notifications (read)
    for (const application of (applications || [])) {
      const linkPath = `/developer/submissions?job=${application.job_id}`;
      if (existingLinks.has(linkPath)) continue;
      const job = jobMap.get(application.job_id);
      const testerName = nameMap.get(application.tester_id) || 'A tester';
      await createNotification({
        userId: developerId,
        title: 'New Application Received',
        body: `${testerName} applied to test ${job?.title || 'your app'}.`,
        type: 'application',
        linkPath,
        status: 'read',
        createdAt: application.created_at,
      });
    }

    // Refresh header after backfill
    window.dispatchEvent(new CustomEvent('squash_notification_updated', { detail: { userId: developerId } }));
  } catch (err) {
    console.warn('[SQUASH] Backfill skipped:', err);
  }
}
