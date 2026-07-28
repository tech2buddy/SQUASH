import {
  Bell,
  Check,
  ChevronDown,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Settings,
  UserCircle2,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import {
  backfillDeveloperNotifications,
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  requestBrowserPushPermission,
  type AppNotification,
} from '../lib/notificationApi';

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

export default function DeveloperHeaderNav() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const userId = session?.userId || 'dev_guest';
  const developerName = session?.name || 'Developer';
  const developerEmail = session?.email || 'developer@squash.co.za';

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      const list = await getUserNotifications(userId);
      setNotifications(list);
    } catch (err) {
      console.warn('Failed to load developer notifications:', err);
    }
  };

  useEffect(() => {
    if (!userId || userId === 'dev_guest') return;

    // Backfill past events as read — runs once per session, won't re-trigger badge
    backfillDeveloperNotifications(userId).then(() => fetchNotifications());

    const handleUpdated = () => {
      fetchNotifications();
    };

    window.addEventListener('squash_notification_updated', handleUpdated);
    const interval = setInterval(fetchNotifications, 5000);

    return () => {
      window.removeEventListener('squash_notification_updated', handleUpdated);
      clearInterval(interval);
    };
  }, [userId]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  const handleNotificationClick = async (notif: AppNotification) => {
    if (notif.status === 'unread') {
      await markNotificationAsRead(notif.id, userId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, status: 'read' } : n)),
      );
    }
    setNotificationsOpen(false);
    navigate(notif.linkPath);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, status: 'read' })));
  };

  const handleEnablePush = async () => {
    const perm = await requestBrowserPushPermission();
    setPushPermission(perm);
  };

  return (
    <div ref={containerRef} className="relative flex items-center gap-3 sm:gap-4">
      {/* Notification Bell Icon */}
      <button
        type="button"
        onClick={() => {
          setNotificationsOpen((prev) => !prev);
          setProfileOpen(false);
        }}
        className={`relative rounded-full border p-2.5 transition ${
          notificationsOpen
            ? 'border-green-600 bg-green-50 text-green-700'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
        }`}
        aria-label="Toggle notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {/* User Profile Pill */}
      <button
        type="button"
        onClick={() => {
          setProfileOpen((prev) => !prev);
          setNotificationsOpen(false);
        }}
        className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-left shadow-sm transition ${
          profileOpen
            ? 'border-green-600 bg-green-50/60 ring-2 ring-green-100'
            : 'border-slate-200 bg-white hover:bg-slate-50'
        }`}
        aria-label="User account menu"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold">
          <UserCircle2 className="h-7 w-7" />
        </div>
        <div className="hidden sm:block">
          <div className="text-sm font-bold text-slate-900 leading-tight">{developerName}</div>
          {/* Email, not just the role: two accounts can share a display name,
              and without this there is nothing on screen telling them apart. */}
          <div className="max-w-[180px] truncate text-xs text-slate-500">{session?.email || 'Developer'}</div>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${profileOpen ? 'rotate-180 text-green-700' : ''}`} />
      </button>

      {/* Notifications Dropdown - Aligned Flush to Right edge of Header Controls */}
      {notificationsOpen && (
        <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 max-w-[calc(100vw-2rem)] rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 px-1">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Developer Notifications</h3>
              <p className="text-xs text-slate-500">{unreadCount} unread alert{unreadCount === 1 ? '' : 's'}</p>
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:underline"
              >
                <Check className="h-3.5 w-3.5" />
                Mark all read
              </button>
            ) : (
              <Link
                to="/developer/activity"
                onClick={() => setNotificationsOpen(false)}
                className="text-xs font-semibold text-green-700 hover:underline"
              >
                All Activity
              </Link>
            )}
          </div>

          {/* Desktop Push Permission Banner */}
          <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-100 p-2.5 text-xs">
            {pushPermission === 'granted' ? (
              <div className="flex items-center justify-between text-green-700 font-semibold px-1">
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Real-time push alerts enabled
                </span>
                <Zap className="h-3.5 w-3.5 text-green-600" />
              </div>
            ) : (
              <button
                type="button"
                onClick={handleEnablePush}
                className="w-full flex items-center justify-between rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 transition shadow-sm"
              >
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 fill-current" />
                  Enable Desktop Push Alerts
                </span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">1-Click</span>
              </button>
            )}
          </div>

          <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs font-semibold text-slate-500">
                No notifications yet. You will be alerted when testers apply or submit reports.
              </div>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNotificationClick(item)}
                  className={`w-full block rounded-2xl p-3 text-left transition border ${
                    item.status === 'unread'
                      ? 'bg-green-50/40 border-green-200/80'
                      : 'bg-white hover:bg-slate-50 border-slate-100/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {item.status === 'unread' && (
                        <span className="h-2 w-2 rounded-full bg-green-600" />
                      )}
                      <span className="text-xs font-bold text-slate-900">{item.title}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-4 text-slate-600 line-clamp-2">{item.body}</p>
                </button>
              ))
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 text-center">
            <Link
              to="/developer/applications"
              onClick={() => setNotificationsOpen(false)}
              className="block text-xs font-bold text-green-700 hover:underline py-1"
            >
              Review Tester Submissions →
            </Link>
          </div>
        </div>
      )}

        {/* Profile Dropdown Menu */}
        {profileOpen && (
          <div className="absolute right-0 top-full mt-3 w-72 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header info */}
            <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
              <div className="text-sm font-bold text-slate-900">{developerName}</div>
              <div className="text-xs text-slate-500 truncate">{developerEmail}</div>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-bold text-green-800">
                <Zap className="h-3 w-3" />
                Developer Workspace
              </div>
            </div>

            {/* Links */}
            <div className="mt-3 space-y-1 text-sm font-semibold text-slate-700">
              <Link
                to="/dashboard"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <LayoutDashboard className="h-4 w-4 text-slate-400" />
                Developer Dashboard
              </Link>
              <Link
                to="/choose-workspace"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <RefreshCw className="h-4 w-4 text-slate-400" />
                Switch / Choose Workspace
              </Link>
              <Link
                to="/billing"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <CreditCard className="h-4 w-4 text-slate-400" />
                Billing & Payment Setup
              </Link>
              <Link
                to="/developer/applications"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <FileText className="h-4 w-4 text-slate-400" />
                Tester Submissions & Reports
              </Link>
              <Link
                to="/developer/activity"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                Activity & Settings
              </Link>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100">
              <Link
                to="/logout"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="h-4 w-4 text-red-500" />
                Sign Out
              </Link>
            </div>
          </div>
        )}
    </div>
  );
}
