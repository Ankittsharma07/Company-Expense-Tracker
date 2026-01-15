import React from 'react';
import { useUser } from '../../context/UserContext';
import { Bell, Search, ChevronDown, Command } from 'lucide-react';
import { Role } from '../../data/mockData';

export const Navbar = () => {
  const { user, role, setRole } = useUser();

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/60 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-20 transition-all">
      <div className="flex items-center flex-1">
        <div className="relative w-full max-w-md hidden sm:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search expenses..."
            className="w-full pl-10 pr-12 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
             <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-gray-200 bg-gray-50 px-1.5 font-mono text-[10px] font-medium text-gray-500 opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Role Switcher for Demo */}
        <div className="hidden md:flex items-center bg-gray-100/80 p-1 rounded-lg border border-gray-200/50">
          {(['admin', 'manager', 'employee'] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all duration-200 ${
                role === r
                  ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-gray-200" />

        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-2 cursor-pointer group">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-9 h-9 rounded-full border border-gray-200 object-cover shadow-sm group-hover:ring-2 group-hover:ring-indigo-500/20 transition-all"
            />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-gray-900 leading-none group-hover:text-indigo-600 transition-colors">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize mt-1">{user.role}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block group-hover:text-gray-600 transition-colors" />
        </div>
      </div>
    </header>
  );
};
