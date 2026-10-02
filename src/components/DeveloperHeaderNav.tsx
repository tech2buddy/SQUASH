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
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
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

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const list = await getUserNotifications(userId);
      setNotifications(list);
    } catch (err) {
      console.warn('Failed to load developer notifications:', err);
    }
  }, [userId]);

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
  }, [fetchNotifications, userId]);

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
    <div ref={containerRef} className="relative flex items-center gap-2">
      {/* Notification Bell Icon */}
      <button
        type="button"
        onClick={() => {
          setNotificationsOpen((prev) => !prev);
          setProfileOpen(false);
        }}
        className={`relative flex h-[32px] w-[32px] items-center justify-center rounded-md border text-[#181817] transition ${
          notificationsOpen
            ? 'border-[#DADAD7] bg-[#EEEEEC]'
            : 'border-[#E7E7E5] bg-[#FFFFFF] hover:bg-[#F7F7F6]'
        }`}
        aria-label="Toggle notifications"
      >
        <Bell className="h-3.5 w-3.5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2 rounded-full bg-[#16A34A]" />
        )}
      </button>

      {/* User Profile Pill */}
      <button
        type="button"
        onClick={() => {
          setProfileOpen((prev) => !prev);
          setNotificationsOpen(false);
        }}
        className={`flex h-[32px] items-center gap-2 rounded-md border px-2 text-left transition ${
          profileOpen
            ? 'border-[#DADAD7] bg-[#EEEEEC]'
            : 'border-[#E7E7E5] bg-[#FFFFFF] hover:bg-[#F7F7F6]'
        }`}
        aria-label="User account menu"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1D1D1B] text-[10px] font-medium text-white">
          {developerName.charAt(0).toUpperCase()}
        </div>
        <span className="hidden max-w-[120px] truncate text-xs font-medium text-[#181817] sm:inline-block">{developerName}</span>
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${profileOpen ? 'rotate-180' : 'text-[#92928E]'}`} />
      </button>

      {/* Notifications Dropdown */}
      {notificationsOpen && (
        <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-96 max-w-[calc(100vw-1.5rem)] rounded-3xl border border-black/[0.06] bg-white p-5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-3.5 border-b border-black/[0.06] px-1">
            <div>
              <h3 className="text-sm font-extrabold text-[#1d1d1f] tracking-tight">Notifications</h3>
              <p className="text-xs text-[#86868b]">{unreadCount} unread alert{unreadCount === 1 ? '' : 's'}</p>
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#e63946] hover:underline"
              >
                <Check className="h-3.5 w-3.5" />
                Mark all read
              </button>
            ) : (
              <Link
                to="/developer/activity"
                onClick={() => setNotificationsOpen(false)}
                className="text-xs font-semibold text-[#e63946] hover:underline"
              >
                All Activity
              </Link>
            )}
          </div>

          {/* Desktop Push Permission Banner */}
          <div className="mt-3 rounded-2xl bg-[#f5f5f7] border border-black/[0.06] p-3 text-xs">
            {pushPermission === 'granted' ? (
              <div className="flex items-center justify-between text-[#e63946] font-semibold px-1">
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e63946] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e63946]"></span>
                  </span>
                  Real-time push alerts enabled
                </span>
                <Zap className="h-3.5 w-3.5 text-[#e63946]" />
              </div>
            ) : (
              <button
                type="button"
                onClick={handleEnablePush}
                className="w-full flex items-center justify-between rounded-xl bg-[#e63946] hover:bg-[#d62828] text-white font-semibold px-3.5 py-2 transition shadow-2xs active:scale-98"
              >
                <span className="flex items-center gap-1.5 text-xs">
                  <Zap className="h-3.5 w-3.5 fill-current" />
                  Enable Desktop Push Alerts
                </span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">1-Click</span>
              </button>
            )}
          </div>

          <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs font-normal text-[#86868b] leading-relaxed">
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
                      ? 'bg-rose-50/50 border-rose-200/80'
                      : 'bg-white hover:bg-[#f5f5f7] border-black/[0.06]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {item.status === 'unread' && (
                        <span className="h-2 w-2 rounded-full bg-[#e63946]" />
                      )}
                      <span className="text-xs font-extrabold text-[#1d1d1f]">{item.title}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#86868b]">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-4 text-[#86868b] line-clamp-2">{item.body}</p>
                </button>
              ))
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-black/[0.06] text-center">
            <Link
              to="/developer/applications"
              onClick={() => setNotificationsOpen(false)}
              className="block text-xs font-semibold text-[#e63946] hover:underline py-1"
            >
              Review Tester Submissions →
            </Link>
          </div>
        </div>
      )}

        {/* Profile Dropdown Menu */}
        {profileOpen && (
          <div className="absolute right-0 top-full mt-3 w-72 rounded-3xl border border-black/[0.06] bg-white p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header info */}
            <div className="rounded-2xl bg-[#f5f5f7] p-3.5 border border-black/[0.06]">
              <div className="text-sm font-extrabold text-[#1d1d1f]">{developerName}</div>
              <div className="text-xs text-[#86868b] truncate">{developerEmail}</div>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-100 px-2.5 py-0.5 text-[10px] font-extrabold text-[#e63946]">
                <Zap className="h-3 w-3" />
                Developer Workspace
              </div>
            </div>

            {/* Links */}
            <div className="mt-3 space-y-1 text-xs font-semibold text-[#1d1d1f]">
              <Link
                to="/dashboard"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-[#f5f5f7] transition"
              >
                <LayoutDashboard className="h-4 w-4 text-[#86868b]" />
                Developer Dashboard
              </Link>
              <Link
                to="/choose-workspace"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-[#f5f5f7] transition"
              >
                <RefreshCw className="h-4 w-4 text-[#86868b]" />
                Switch Workspace
              </Link>
              <Link
                to="/billing"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-[#f5f5f7] transition"
              >
                <CreditCard className="h-4 w-4 text-[#86868b]" />
                Billing & Payment Setup
              </Link>
              <Link
                to="/developer/applications"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-[#f5f5f7] transition"
              >
                <FileText className="h-4 w-4 text-[#86868b]" />
                Tester Submissions & Reports
              </Link>
              <Link
                to="/developer/activity"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-[#f5f5f7] transition"
              >
                <Settings className="h-4 w-4 text-[#86868b]" />
                Activity & Settings
              </Link>
            </div>

            <div className="mt-3 pt-2 border-t border-black/[0.06]">
              <Link
                to="/logout"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
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
