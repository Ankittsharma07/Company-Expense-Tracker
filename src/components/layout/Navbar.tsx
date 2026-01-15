import React from 'react';
import { useUser } from '../../context/UserContext';
import { Bell, Search, ChevronDown } from 'lucide-react';
import { Role } from '../../data/mockData';

export const Navbar = () => {
  const { user, role, setRole } = useUser();

  return (
    <header className="h-16 bg-gradient-to-r from-white/85 via-white/75 to-white/65 backdrop-blur-2xl border-b border-slate-200/60 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-20 transition-all shadow-[0_10px_24px_rgba(15,23,42,0.06)] ring-1 ring-white/60">
      <div className="flex items-center flex-1">
        <div className="relative w-full max-w-md hidden sm:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
          <input
            type="text"
            placeholder="Search expenses..."
            className="w-full pl-10 pr-12 py-2 text-sm border border-slate-200/70 rounded-xl bg-white/80 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500/60 focus:bg-white transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_24px_rgba(15,23,42,0.08)]"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
             <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-slate-200/70 bg-slate-50 px-1.5 font-mono text-[10px] font-medium text-slate-500 opacity-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Role Switcher for Demo */}
        <div className="hidden md:flex items-center bg-white/70 p-1 rounded-xl border border-slate-200/60 shadow-[0_10px_22px_rgba(15,23,42,0.06)]">
          {(['admin', 'manager', 'employee'] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all duration-200 ${
                role === r
                  ? 'bg-white text-teal-700 shadow-sm ring-1 ring-black/5'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-slate-200/80" />

        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full bg-white/70 border border-slate-200/60 shadow-[0_8px_18px_rgba(15,23,42,0.06)] hover:bg-white">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-2 cursor-pointer group">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-9 h-9 rounded-full border border-slate-200 object-cover shadow-[0_8px_18px_rgba(15,23,42,0.12)] group-hover:ring-2 group-hover:ring-teal-500/25 transition-all"
            />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-slate-900 leading-none group-hover:text-teal-700 transition-colors">{user.name}</p>
            <p className="text-xs text-slate-500 capitalize mt-1">{user.role}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block group-hover:text-slate-600 transition-colors" />
        </div>
      </div>
    </header>
  );
};
