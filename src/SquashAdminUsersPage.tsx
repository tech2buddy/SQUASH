import {
  BadgeCheck,
  Bell,
  CreditCard,
  FileText,
  Home,
  LockKeyhole,
  Menu,
  Search,
  ShieldCheck,
  UserCircle2,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from './auth';
import { getAdminUsers, type AdminUserRow } from './lib/adminApi';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function roleClass(role: AdminUserRow['role']) {
  if (role === 'admin') return 'bg-green-50 text-green-700 ring-green-100';
  if (role === 'developer') return 'bg-sky-50 text-sky-700 ring-sky-100';
  return 'bg-slate-50 text-slate-700 ring-slate-200';
}

type UserFilter = 'all' | AdminUserRow['role'];

export default function SquashAdminUsersPage() {
  const { session } = useAuth();
  const adminName = session?.name || 'Mzwakhe Khosa';
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [filter, setFilter] = useState<UserFilter>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await getAdminUsers(50));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load users right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = filter === 'all' ? users : users.filter((user) => user.role === filter);
  const admins = users.filter((user) => user.role === 'admin').length;
  const developers = users.filter((user) => user.role === 'developer').length;
  const testers = users.filter((user) => user.role === 'tester').length;

  const navItems = [
    { label: 'Overview', href: '/A31/dashboard', icon: Home, active: false },
    { label: 'Payout Queue', href: '/A31/payouts', icon: CreditCard, active: false },
    { label: 'Users', href: '/A31/users', icon: Users, active: true },
    { label: 'Jobs', href: '/A31/jobs', icon: FileText, active: false },
    { label: 'Security', href: '/A31/security', icon: LockKeyhole, active: false },
  ];

  const stats = [
    { label: 'Total Users', value: users.length, note: 'Registered accounts', icon: Users, bg: 'bg-slate-50', color: 'text-slate-700' },
    { label: 'Admins', value: admins, note: 'Owner or manager access', icon: ShieldCheck, bg: 'bg-green-50', color: 'text-green-700' },
    { label: 'Developers', value: developers, note: 'Can post testing jobs', icon: BadgeCheck, bg: 'bg-sky-50', color: 'text-sky-700' },
    { label: 'Testers', value: testers, note: 'Can apply and submit reports', icon: UserCircle2, bg: 'bg-amber-50', color: 'text-amber-700' },
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

          <div className="p-4 pt-0">
            <div className="rounded-3xl border border-green-100 bg-green-50 p-5 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <ShieldCheck className="h-5 w-5 text-green-700" />
                Safe admin phase
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                User controls are protected so account changes can be reviewed carefully before they affect the platform.
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 lg:h-screen lg:overflow-y-auto">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <a href="/A31/dashboard" className="rounded-xl border border-slate-300 p-2.5 text-slate-600 lg:hidden">
                  <Menu className="h-5 w-5" />
                </a>
                <div className="hidden max-w-xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex md:min-w-[340px] lg:min-w-[460px]">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search users, emails, roles..." />
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <button type="button" className="relative rounded-full border border-slate-200 p-2.5 text-slate-600">
                  <Bell className="h-5 w-5" />
                </button>
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
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-100">
                  Admin user management
                </div>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Users</h1>
                <p className="mt-2 max-w-3xl text-slate-600">
                  See who is joining SQUASH, what role they use, and where profile data is still missing.
                </p>
              </div>
              <button
                type="button"
                onClick={loadUsers}
                disabled={loading}
                className="w-fit rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {loading ? 'Refreshing...' : 'Refresh Users'}
              </button>
            </div>

            {error ? <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div> : null}

            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-600">{card.label}</div>
                        <div className="mt-2 text-3xl font-black text-slate-900">{card.value}</div>
                        <div className="mt-2 text-xs leading-5 text-slate-500">{card.note}</div>
                      </div>
                      <div className={`grid h-11 w-11 place-items-center rounded-2xl ${card.bg}`}>
                        <Icon className={`h-5 w-5 ${card.color}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="mt-8 rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">User directory</h2>
                  <p className="mt-1 text-sm text-slate-600">Manage and review all SQUASH user accounts from one secure workspace.</p>
                </div>
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value as UserFilter)}
                  className="w-fit rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-green-500"
                >
                  <option value="all">All roles</option>
                  <option value="admin">Admins</option>
                  <option value="developer">Developers</option>
                  <option value="tester">Testers</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                      <th className="px-6 py-4 font-medium">User</th>
                      <th className="px-6 py-4 font-medium">Role</th>
                      <th className="px-6 py-4 font-medium">City</th>
                      <th className="px-6 py-4 font-medium">Phone</th>
                      <th className="px-6 py-4 font-medium">Joined</th>
                      <th className="px-6 py-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-6 py-5">
                          <div className="font-semibold text-slate-900">{user.name}</div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ${roleClass(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-600">{user.city || 'Not set'}</td>
                        <td className="px-6 py-5 text-sm text-slate-600">{user.phone || 'Not set'}</td>
                        <td className="px-6 py-5 text-sm text-slate-500">{formatDate(user.createdAt)}</td>
                        <td className="px-6 py-5">
                          <a
                            href={`/A31/users/${user.id}`}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            title="Open this user profile for account review."
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-sm leading-6 text-slate-600">
                          No users match this filter yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
