import React from 'react';
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
  Hexagon
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { cn } from '../../lib/utils';

export const Sidebar = () => {
  const { role } = useUser();

  const links = [
    { name: 'Overview', to: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'employee'] },
    { name: 'Expenses', to: '/dashboard/expenses', icon: CreditCard, roles: ['manager', 'employee'] },
    { name: 'Approvals', to: '/dashboard/approvals', icon: FileText, roles: ['manager', 'admin'] },
    { name: 'Team', to: '/dashboard/team', icon: Users, roles: ['admin', 'manager'] },
    { name: 'Reports', to: '/dashboard/reports', icon: PieChart, roles: ['admin'] },
    { name: 'Subscription', to: '/dashboard/subscription', icon: Building2, roles: ['admin'] },
    { name: 'Settings', to: '/dashboard/settings', icon: Settings, roles: ['admin', 'manager', 'employee'] },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200/60 hidden md:flex flex-col fixed inset-y-0 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="h-16 flex items-center px-6 border-b border-gray-100/50">
        <div className="flex items-center gap-2.5 text-indigo-600">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <Hexagon className="w-5 h-5 fill-current" />
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">DualSpend</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4">
        <div className="mb-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
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
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )
              }
            >
              <link.icon className={cn("w-4 h-4 transition-colors", ({ isActive }: any) => isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600")} />
              {link.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-100/50 bg-gray-50/30">
        <button className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group">
          <LogOut className="w-4 h-4 group-hover:text-red-500" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
