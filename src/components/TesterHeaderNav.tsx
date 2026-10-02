import {
  Award,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  DollarSign,
  LogOut,
  RefreshCw,
  Search,
  Settings,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../auth';
import TesterAvatar from './TesterAvatar';
import { useTesterAvatarUrl } from '../hooks/useTesterAvatarUrl';
import {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
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

export default function TesterHeaderNav() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const userId = session?.userId || 'tester_guest';
  const testerName = session?.name || 'Sipho N.';
  const testerEmail = session?.email || 'tester@squash.co.za';

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const testerAvatarUrl = useTesterAvatarUrl(session?.userId);

  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const list = await getUserNotifications(userId);
      setNotifications(list);
    } catch (err) {
      console.warn('Failed to load tester notifications:', err);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();

    const handleUpdated = (e: Event) => {
      const custom = e as CustomEvent;
      if (!custom.detail?.userId || custom.detail.userId === userId) {
        fetchNotifications();
      }
    };

    window.addEventListener('squash_notification_updated', handleUpdated);
    const interval = setInterval(fetchNotifications, 10000);

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

  return (
    <div ref={containerRef} className="relative flex items-center gap-2">
      {/* Notification Bell Icon */}
      <div className="relative">
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

        {/* Notifications Dropdown */}
        {notificationsOpen && (
          <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 max-w-[calc(100vw-1.5rem)] rounded-lg border border-[#E7E7E5] bg-[#FFFFFF] p-3 shadow-md z-50 animate-fade-in-fast">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E7E5] px-1">
              <div>
                <h3 className="text-xs font-semibold text-[#181817]">Notifications</h3>
                <p className="text-[10px] text-[#666663]">{unreadCount} unread</p>
              </div>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#16A34A] hover:underline"
                >
                  <Check className="h-3 w-3" />
                  Mark all read
                </button>
              ) : (
                <Link
                  to="/tester/notifications"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-[11px] font-medium text-[#666663] hover:underline"
                >
                  All Notifications
                </Link>
              )}
            </div>

            <div className="mt-2 space-y-1 max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-xs font-normal text-[#92928E]">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNotificationClick(item)}
                    className={`w-full block rounded-md p-2.5 text-left transition border ${
                      item.status === 'unread'
                        ? 'bg-[#EAF7EF]/40 border-[#238554]/20'
                        : 'bg-[#FFFFFF] hover:bg-[#F7F7F6] border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {item.status === 'unread' && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                        )}
                        <span className="text-xs font-medium text-[#181817]">{item.title}</span>
                      </div>
                      <span className="text-[10px] text-[#92928E]">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#666663] line-clamp-2">{item.body}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Profile Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setProfileOpen((prev) => !prev);
            setNotificationsOpen(false);
          }}
          className={`flex items-center gap-2 h-[32px] rounded-md border px-2 text-left transition ${
            profileOpen
              ? 'border-[#DADAD7] bg-[#EEEEEC]'
              : 'border-[#E7E7E5] bg-[#FFFFFF] hover:bg-[#F7F7F6]'
          }`}
          aria-label="User account menu"
        >
          <TesterAvatar name={testerName} avatarUrl={testerAvatarUrl} className="h-5 w-5 rounded-full" />
          <span className="hidden sm:inline-block text-xs font-medium text-[#181817] max-w-[120px] truncate">
            {testerName}
          </span>
          <ChevronDown className="h-3 w-3 text-[#92928E]" />
        </button>

        {/* Profile Dropdown Menu */}
        {profileOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-lg border border-[#E7E7E5] bg-[#FFFFFF] p-3 shadow-md z-50 animate-fade-in-fast">
            {/* Header info */}
            <div className="rounded-md bg-[#F7F7F6] p-2.5 border border-[#E7E7E5]">
              <div className="text-xs font-semibold text-[#181817]">{testerName}</div>
              <div className="text-[11px] text-[#666663] truncate">{testerEmail}</div>
              <div className="mt-1.5 inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium bg-[#EAF7EF] text-[#238554]">
                Verified Tester
              </div>
            </div>

            {/* Links */}
            <div className="mt-2 space-y-0.5 text-xs text-[#181817]">
              <Link
                to="/tester-jobs"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 rounded-md px-2.5 py-1.5 hover:bg-[#F7F7F6] transition-colors"
              >
                <Search className="h-3.5 w-3.5 text-[#92928E]" />
                Browse Available Tests
              </Link>
              <Link
                to="/active-test"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 rounded-md px-2.5 py-1.5 hover:bg-[#F7F7F6] transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-[#92928E]" />
                Active Tests & Lab
              </Link>
              <Link
                to="/tester/earnings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 rounded-md px-2.5 py-1.5 hover:bg-[#F7F7F6] transition-colors"
              >
                <DollarSign className="h-3.5 w-3.5 text-[#92928E]" />
                Earnings & Payouts
              </Link>
              <Link
                to="/tester/level-benefits"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 rounded-md px-2.5 py-1.5 hover:bg-[#F7F7F6] transition-colors"
              >
                <Award className="h-3.5 w-3.5 text-[#92928E]" />
                Level & Benefits
              </Link>
              <Link
                to="/choose-workspace"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 rounded-md px-2.5 py-1.5 hover:bg-[#F7F7F6] transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5 text-[#92928E]" />
                Switch Workspace
              </Link>
              <Link
                to="/tester/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 rounded-md px-2.5 py-1.5 hover:bg-[#F7F7F6] transition-colors"
              >
                <Settings className="h-3.5 w-3.5 text-[#92928E]" />
                Account Settings
              </Link>
            </div>

            <div className="mt-2 pt-2 border-t border-[#E7E7E5]">
              <Link
                to="/logout"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-[#C95050] hover:bg-[#FDECEC] transition-colors font-medium"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
