import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, ChevronDown, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return null;
  }

  const userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0d9488&color=fff`;
  const displayRole = user.role.toLowerCase();

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
        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full bg-white/70 border border-slate-200/60 shadow-[0_8px_18px_rgba(15,23,42,0.06)] hover:bg-white">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>

        <div className="h-6 w-px bg-slate-200/80" />

        <div className="relative" ref={dropdownRef}>
          <div
            className="flex items-center gap-3 pl-2 cursor-pointer group"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="relative">
              <img
                src={userAvatar}
                alt={user.name}
                className="w-9 h-9 rounded-full border border-slate-200 object-cover shadow-[0_8px_18px_rgba(15,23,42,0.12)] group-hover:ring-2 group-hover:ring-teal-500/25 transition-all"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-900 leading-none group-hover:text-teal-700 transition-colors">{user.name}</p>
              <p className="text-xs text-slate-500 capitalize mt-1">{displayRole}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 hidden sm:block group-hover:text-slate-600 transition-all ${showDropdown ? 'rotate-180' : ''}`} />
          </div>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-[0_20px_60px_rgba(15,23,42,0.15)] border border-slate-200/60 py-2 z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
              </div>

              <div className="py-1">
                <button
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  Profile
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Settings
                </button>
              </div>

              <div className="border-t border-slate-100 py-1">
                <button
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                  onClick={() => {
                    setShowDropdown(false);
                    logout();
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
