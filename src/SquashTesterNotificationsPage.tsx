import {
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FileText,
  ShieldCheck,
  } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';



import { useAuth } from './auth';
import {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
} from './lib/notificationApi';

type FilterType = 'All' | 'job' | 'application' | 'report' | 'payout' | 'security';

function formatRelativeTime(dateStr: string) {
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return 'Recently';
  }
}

function typeTone(type: AppNotification['type']) {
  if (type === 'job') return 'bg-green-50 text-green-700 ring-green-100';
  if (type === 'application') return 'bg-sky-50 text-sky-700 ring-sky-100';
  if (type === 'report') return 'bg-amber-50 text-amber-700 ring-amber-100';
  if (type === 'payout') return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
  return 'bg-slate-50 text-slate-700 ring-slate-100';
}

function typeIcon(type: AppNotification['type']) {
  if (type === 'job') return BriefcaseBusiness;
  if (type === 'application') return ClipboardList;
  if (type === 'report') return FileText;
  if (type === 'payout') return CircleDollarSign;
  return ShieldCheck;
}

export default function SquashTesterNotificationsPage() {
  const { session } = useAuth();
  
  const userId = session?.userId || 'tester_guest';
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<FilterType>('All');
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const list = await getUserNotifications(userId);
      setNotifications(list);
    } catch (err) {
      console.warn('Unable to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleUpdated = (e: Event) => {
      const custom = e as CustomEvent;
      if (!custom.detail?.userId || custom.detail.userId === userId) {
        fetchNotifications();
      }
    };

    window.addEventListener('squash_notification_updated', handleUpdated);
    return () => {
      window.removeEventListener('squash_notification_updated', handleUpdated);
    };
  }, [userId]);

  

  const unreadCount = notifications.filter((item) => item.status === 'unread').length;
  const filteredNotifications = useMemo(
    () => (filter === 'All' ? notifications : notifications.filter((item) => item.type === filter)),
    [filter, notifications],
  );
  const filters: Array<{ label: string; value: FilterType }> = [
    { label: 'All', value: 'All' },
    { label: 'Jobs', value: 'job' },
    { label: 'Applications', value: 'application' },
    { label: 'Reports', value: 'report' },
    { label: 'Payouts', value: 'payout' },
    { label: 'Security', value: 'security' },
  ];

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(userId);
    setNotifications((prev) => prev.map((item) => ({ ...item, status: 'read' })));
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationAsRead(id, userId);
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'read' } : item)));
  };

  return (
    <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-100">
                  <Bell className="h-4 w-4" /> Notification center
                </div>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Notifications</h1>
                <p className="mt-2 max-w-2xl text-slate-600">Track job matches, application decisions, report requests, payout updates, and security notices.</p>
              </div>
              <button type="button" onClick={handleMarkAllRead} className="w-fit rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">
                Mark all as read
              </button>
            </div>

            <section className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-sm font-semibold text-slate-500">Unread</div>
                <div className="mt-2 text-3xl font-black text-slate-900">{unreadCount}</div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-sm font-semibold text-slate-500">Total notices</div>
                <div className="mt-2 text-3xl font-black text-slate-900">{notifications.length}</div>
              </div>
              <div className="rounded-3xl border border-green-100 bg-green-50 p-5 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-slate-900"><CheckCircle2 className="h-5 w-5 text-green-700" /> Action-ready</div>
                <p className="mt-2 text-sm leading-6 text-slate-700">Each notification links directly to the page where you can act.</p>
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Inbox</h2>
                  <p className="mt-1 text-sm text-slate-600">Real-time synchronized notification alerts for your account.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setFilter(item.value)}
                      className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                        filter === item.value
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading notifications...</div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-sm font-semibold text-slate-500">No notifications found in this view.</div>
                ) : (
                  filteredNotifications.map((item) => {
                    const Icon = typeIcon(item.type);
                    return (
                      <div
                        key={item.id}
                        className={`flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between transition ${
                          item.status === 'unread' ? 'bg-green-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`rounded-2xl p-3 ring-1 ${typeTone(item.type)}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-slate-900">{item.title}</span>
                              {item.status === 'unread' && (
                                <span className="rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-bold text-white">New</span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-slate-600">{item.body}</p>
                            <div className="mt-2 text-xs text-slate-400">{formatRelativeTime(item.createdAt)}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:self-center">
                          {item.status === 'unread' && (
                            <button
                              type="button"
                              onClick={() => handleMarkRead(item.id)}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              Mark read
                            </button>
                          )}
                          <a
                            href={item.linkPath}
                            onClick={() => handleMarkRead(item.id)}
                            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                          >
                            View →
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
    </div>
  );
}
