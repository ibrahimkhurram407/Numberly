import React from 'react';
import { Flame, Heart, Star } from 'lucide-react';

import type { UserProfile } from '../types';

interface TopBarProps {
  user: UserProfile;
}

const Stat = ({
  label,
  value,
  colorClass,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  colorClass: string;
  icon: React.ElementType;
}) => (
  <div className="flex items-center gap-3 rounded-2xl border-2 border-white/70 bg-white/80 px-4 py-3 backdrop-blur">
    <Icon className={colorClass} size={20} fill="currentColor" />
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="font-black text-slate-800">{value}</p>
    </div>
  </div>
);

export const TopBar = ({ user }: TopBarProps) => {
  const lessonsCompleted = user.progress.length;
  const dailyProgress = Math.min(Math.round((lessonsCompleted / Math.max(user.dailyGoal, 1)) * 100), 100);

  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-md lg:left-72 lg:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Stat label="Streak" value={user.streakDays} colorClass="text-orange-500" icon={Flame} />
          <Stat label="XP" value={user.totalXp} colorClass="text-amber-500" icon={Star} />
          <Stat label="Hearts" value={user.hearts} colorClass="text-red-500" icon={Heart} />
        </div>

        <div className="hidden items-center gap-4 rounded-[2rem] border-2 border-slate-100 bg-white px-4 py-3 md:flex">
          <div className="w-40">
            <div className="mb-1 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              <span>Daily Goal</span>
              <span>{dailyProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-sky-500" style={{ width: `${dailyProgress}%` }} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black text-white"
              style={{ backgroundColor: user.avatarColor }}
            >
              {user.displayName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="font-black text-slate-800">{user.displayName}</p>
              <p className="text-sm font-semibold text-slate-500">Age group {user.ageGroup}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
