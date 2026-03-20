import React from 'react';
import { BookOpen, FolderPlus, LogOut, Settings, Trophy, User } from 'lucide-react';

import { cn } from '../../lib/utils';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onSignOut: () => void;
}

const navItems = [
  { id: 'learn', label: 'Learn', icon: BookOpen },
  { id: 'content', label: 'Content', icon: FolderPlus },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'profile', label: 'Account', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar = ({ currentPage, onPageChange, onSignOut }: SidebarProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-slate-200 bg-white px-4 py-2 lg:relative lg:h-full lg:w-72 lg:flex-col lg:items-stretch lg:justify-start lg:gap-2 lg:border-r lg:border-t-0 lg:p-5">
      <div className="hidden rounded-[2rem] bg-[linear-gradient(180deg,#0ea5e9_0%,#0284c7_100%)] p-6 text-white lg:block">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-sky-100">Numberly</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight">Calm maths play</h1>
        <p className="mt-3 font-semibold text-sky-50/90">
          Structured learning, clear feedback, and a database-backed learner profile.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-around gap-2 lg:mt-6 lg:flex-col lg:items-stretch lg:justify-start">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onPageChange(id)}
            className={cn(
              'flex items-center gap-4 rounded-2xl px-4 py-3 transition lg:w-full',
              currentPage === id ? 'bg-sky-100 text-sky-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
            )}
          >
            <Icon size={24} />
            <span className="hidden text-lg font-black uppercase tracking-[0.18em] lg:block">{label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={onSignOut}
        className="hidden items-center gap-3 rounded-2xl border-2 border-slate-100 px-4 py-3 font-black text-slate-500 transition hover:border-slate-200 hover:text-slate-800 lg:flex"
      >
        <LogOut size={18} />
        Sign out
      </button>
    </nav>
  );
};
