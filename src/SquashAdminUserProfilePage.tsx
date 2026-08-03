import {
  ArrowLeft,
  Bell,
  CreditCard,
  FileText,
  Home,
  LockKeyhole,
  Mail,
  Megaphone,
  Menu,
  Search,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useAuth } from './auth';
import {
  getAdminUserDetail,
  sendAdminUserNotification,
  updateAdminUserAccountStatus,
  type AdminUserDetail,
} from './lib/adminApi';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function statusClass(status: AdminUserDetail['accountStatus']) {
  if (status === 'suspended') return 'bg-red-50 text-red-600 ring-red-100';
  if (status === 'under_review') return 'bg-amber-50 text-amber-700 ring-amber-100';
  return 'bg-green-50 text-green-700 ring-green-100';
}

export default function SquashAdminUserProfilePage() {
  const { userId = '' } = useParams();
  const { session } = useAuth();
  const adminName = session?.name || 'Mzwakhe Khosa';
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('Action required on your SQUASH account');
  const [notificationBody, setNotificationBody] = useState('Please update your profile information so we can keep your account in good standing.');
  const [adminNote, setAdminNote] = useState('');

  const loadUser = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      setUser(await getAdminUserDetail(userId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load this user profile right now.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const sendNotification = async () => {
    if (!session?.userId || !user) return;
    setError('');
    setNotice('');
    try {
      await sendAdminUserNotification({
        userId: user.id,
        adminId: session.userId,
        title: notificationTitle,
        body: notificationBody,
        linkPath: user.role === 'tester' ? '/tester/settings' : '/dashboard',
      });
      setNotice('Notification sent to this user.');
      await loadUser();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Could not send notification right now.');
    }
  };

  const updateStatus = async (status: AdminUserDetail['accountStatus']) => {
    if (!session?.userId || !user) return;
    setError('');
    setNotice('');
    try {
      await updateAdminUserAccountStatus({
        userId: user.id,
        adminId: session.userId,
        status,
        note: adminNote,
      });
      setNotice(`Account status updated to ${status.replace('_', ' ')}.`);
      await loadUser();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Could not update account status. Have you run supabase/phase7_admin_user_controls.sql?');
    }
  };

  const navItems = [
    { label: 'Overview', href: '/A31/dashboard', icon: Home, active: false },
    { label: 'Payout Queue', href: '/A31/payouts', icon: CreditCard, active: false },
    { label: 'Users', href: '/A31/users', icon: Users, active: true },
    { label: 'Jobs', href: '/A31/jobs', icon: FileText, active: false },
    { label: 'Security', href: '/A31/security', icon: LockKeyhole, active: false },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen lg:h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-6">
            <img src="/squash-logo.png" alt="SQUASH logo" className="h-11 w-11 rounded-2xl border border-slate-200 object-cover shadow-sm" />
            <a href="/" className="text-2xl font-black tracking-tight text-slate-900 hover:text-green-700">SQUASH</a>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    item.active ? 'bg-green-50 text-green-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 lg:h-screen lg:overflow-y-auto">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <a href="/A31/users" className="rounded-xl border border-slate-300 p-2.5 text-slate-600 lg:hidden">
                  <Menu className="h-5 w-5" />
                </a>
                <div className="hidden max-w-xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex md:min-w-[340px] lg:min-w-[460px]">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search user activity..." />
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                  {adminName.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-bold text-slate-900">{adminName}</div>
                  <div className="text-xs text-slate-500">Admin</div>
                </div>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <a href="/A31/users" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" /> Back to users
            </a>

            {error ? <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div> : null}
            {notice ? <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{notice}</div> : null}

            {loading ? (
              <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-600 shadow-sm">Loading user profile...</div>
            ) : null}

            {!loading && !user ? (
              <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-600 shadow-sm">User profile not found.</div>
            ) : null}

            {user ? (
              <>
                <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="grid h-16 w-16 place-items-center rounded-3xl bg-green-50 text-2xl font-black text-green-700 ring-1 ring-green-100">
                        {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-16 w-16 rounded-3xl object-cover" /> : user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h1 className="text-4xl font-black tracking-tight text-slate-900">{user.name}</h1>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ${statusClass(user.accountStatus)}`}>
                            {user.accountStatus.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="mt-2 text-slate-600">{user.email}</div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold capitalize">
                          <span className="rounded-full bg-slate-50 px-3 py-1 text-slate-700 ring-1 ring-slate-200">{user.role}</span>
                          <span className="rounded-full bg-slate-50 px-3 py-1 text-slate-700 ring-1 ring-slate-200">Joined {formatDate(user.createdAt)}</span>
                          <span className="rounded-full bg-slate-50 px-3 py-1 text-slate-700 ring-1 ring-slate-200">{user.city || 'City not set'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <a
                        href={`mailto:${user.email}?subject=SQUASH account support&body=Hi ${encodeURIComponent(user.name)},%0D%0A%0D%0A`}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Mail className="h-4 w-4" /> Send Email
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationTitle('You have been selected for a featured SQUASH opportunity');
                          setNotificationBody('Your profile is being reviewed for promotion because of your activity and quality on SQUASH.');
                        }}
                        className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
                      >
                        <Megaphone className="h-4 w-4" /> Promote
                      </button>
                    </div>
                  </div>
                </section>

                <section className="mt-8 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                  <div className="space-y-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h2 className="text-2xl font-bold text-slate-900">Account controls</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">Use status changes carefully. Suspended users should not be allowed to continue sensitive workflows once enforcement is added globally.</p>
                      <textarea
                        value={adminNote}
                        onChange={(event) => setAdminNote(event.target.value)}
                        rows={3}
                        placeholder="Admin note for this action"
                        className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500"
                      />
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <button type="button" onClick={() => updateStatus('active')} className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 hover:bg-green-100">Activate</button>
                        <button type="button" onClick={() => updateStatus('under_review')} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-100">Under Review</button>
                        <button type="button" onClick={() => updateStatus('suspended')} className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100">Suspend</button>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h2 className="text-2xl font-bold text-slate-900">Profile information</h2>
                      <div className="mt-5 space-y-4 text-sm">
                        <div className="flex justify-between gap-4"><span className="text-slate-500">Phone</span><span className="font-semibold text-slate-900">{user.phone || 'Not set'}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-slate-500">City</span><span className="font-semibold text-slate-900">{user.city || 'Not set'}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-slate-500">Jobs posted</span><span className="font-semibold text-slate-900">{user.jobsPosted}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-slate-500">Reports submitted</span><span className="font-semibold text-slate-900">{user.reportsSubmitted}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-slate-500">Payout requests</span><span className="font-semibold text-slate-900">{user.payoutRequests}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-green-700" />
                        <h2 className="text-2xl font-bold text-slate-900">Request something</h2>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">Send an in-app notification that appears in this user's SQUASH notifications.</p>
                      <input
                        value={notificationTitle}
                        onChange={(event) => setNotificationTitle(event.target.value)}
                        className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500"
                        placeholder="Notification title"
                      />
                      <textarea
                        value={notificationBody}
                        onChange={(event) => setNotificationBody(event.target.value)}
                        rows={4}
                        className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500"
                        placeholder="Notification message"
                      />
                      <button type="button" onClick={sendNotification} className="mt-4 rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700">
                        Send Notification
                      </button>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h2 className="text-2xl font-bold text-slate-900">Recent notifications</h2>
                      <div className="mt-5 space-y-3">
                        {user.notifications.map((notification) => (
                          <div key={notification.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold text-slate-900">{notification.title}</div>
                                <div className="mt-1 text-sm leading-6 text-slate-600">{notification.body}</div>
                              </div>
                              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold capitalize text-slate-600 ring-1 ring-slate-200">{notification.status}</span>
                            </div>
                            <div className="mt-2 text-xs text-slate-400">{formatDate(notification.createdAt)}</div>
                          </div>
                        ))}
                        {user.notifications.length === 0 ? <div className="text-sm text-slate-600">No notifications sent yet.</div> : null}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="mt-8 grid gap-6 lg:grid-cols-2">
                  {user.developerProfile ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h2 className="text-2xl font-bold text-slate-900">Developer profile</h2>
                      <div className="mt-5 space-y-4 text-sm">
                        <div className="flex justify-between gap-4"><span className="text-slate-500">Company</span><span className="font-semibold text-slate-900">{user.developerProfile.companyName || 'Not set'}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-slate-500">Website</span><span className="font-semibold text-slate-900">{user.developerProfile.websiteUrl || 'Not set'}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-slate-500">Billing Email</span><span className="font-semibold text-slate-900">{user.developerProfile.billingEmail || 'Not set'}</span></div>
                      </div>
                    </div>
                  ) : null}

                  {user.testerProfile ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h2 className="text-2xl font-bold text-slate-900">Tester profile</h2>
                      <div className="mt-5 space-y-4 text-sm">
                        <div className="flex justify-between gap-4"><span className="text-slate-500">Rating</span><span className="font-semibold text-slate-900">{user.testerProfile.rating}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-slate-500">Tests completed</span><span className="font-semibold text-slate-900">{user.testerProfile.testsCompleted}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-slate-500">Public profile</span><span className="font-semibold text-slate-900">{user.testerProfile.isPublic ? 'Yes' : 'No'}</span></div>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {user.testerProfile.specializations.slice(0, 8).map((item: string) => (
                          <span key={item} className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-100">{item}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
