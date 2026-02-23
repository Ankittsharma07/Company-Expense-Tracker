import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Settings,
  PieChart,
  FileText,
  Building2,
  LogOut,
  Hexagon,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export const Sidebar = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const role = user.role.toLowerCase();

  const links = [
    { name: 'Overview', to: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'employee'] },
    { name: 'Expenses', to: '/dashboard/expenses', icon: CreditCard, roles: ['manager', 'employee'] },
    { name: 'Approvals', to: '/dashboard/approvals', icon: FileText, roles: ['manager', 'admin'] },
    { name: 'Team', to: '/dashboard/team', icon: Users, roles: ['admin', 'manager'] },
    { name: 'Reports', to: '/dashboard/reports', icon: PieChart, roles: ['admin'] },
    { name: 'Audit Logs', to: '/dashboard/notification-audit', icon: Bell, roles: ['admin'] },
    { name: 'Subscription', to: '/dashboard/subscription', icon: Building2, roles: ['admin'] },
    { name: 'Settings', to: '/dashboard/settings', icon: Settings, roles: ['admin', 'manager', 'employee'] },
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-white/95 via-white/90 to-slate-50/80 backdrop-blur-xl border-r border-slate-200/60 hidden md:flex flex-col fixed inset-y-0 z-30 shadow-[8px_0_36px_rgba(15,23,42,0.08)]">
      <div className="h-16 flex items-center px-6 border-b border-slate-100/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-700 rounded-lg flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
            <Hexagon className="w-5 h-5 fill-current" />
          </div>
          <span className="text-lg font-semibold text-slate-900 tracking-tight font-display">DualSpend</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4">
        <div className="mb-2 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Menu
        </div>
        <nav className="space-y-1">
          {links.filter(link => link.roles.includes(role)).map((link) => (
            <NavLink
              key={link.name}
              to={link.to}
              end={link.to === '/dashboard'}
              className={({ isActive }) =>
                cn(
                  "relative flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 group",
                  isActive
                    ? "bg-violet-50/80 text-violet-700 shadow-[0_10px_20px_rgba(139,92,246,0.1)] ring-1 ring-violet-600/10 before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-violet-400 before:to-purple-600 before:shadow-[0_0_12px_rgba(139,92,246,0.5)]"
                    : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-900"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <link.icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive ? "text-violet-600" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  {link.name}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-100/70 bg-slate-50/60">
        <button className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-slate-500 bg-white/70 border border-slate-200/70 shadow-[0_8px_18px_rgba(15,23,42,0.06)] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 group">
          <LogOut className="w-4 h-4 group-hover:text-rose-500" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
