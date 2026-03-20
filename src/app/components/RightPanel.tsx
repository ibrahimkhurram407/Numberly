import React from 'react';
import { Target, Trophy, Volume2 } from 'lucide-react';

import type { UserProfile } from '../types';

interface RightPanelProps {
  user: UserProfile;
  onViewLeaderboard: () => void;
}

export const RightPanel = ({ user, onViewLeaderboard }: RightPanelProps) => {
  const completedLessons = user.progress.length;
  const dailyProgress = Math.min(Math.round((completedLessons / Math.max(user.dailyGoal, 1)) * 100), 100);

  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-6 border-l border-slate-100 p-6 pt-28 xl:flex">
      <section className="rounded-[2rem] bg-[linear-gradient(180deg,#fefce8_0%,#ffffff_100%)] p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-500">Session support</p>
        <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">Keep the routine steady</h3>
        <p className="mt-3 font-semibold text-slate-500">
          Sound prompts are currently <span className="text-slate-800">{user.settings.soundEnabled ? 'on' : 'off'}</span>. Preferred voice:
          <span className="ml-1 text-slate-800 capitalize">{user.settings.preferredVoice}</span>.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-black text-slate-600 shadow-sm">
          <Volume2 size={16} />
          Gentle cues
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-sky-100 p-3 text-sky-600">
            <Target size={20} />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Daily goal</p>
            <h3 className="text-2xl font-black text-slate-900">{completedLessons} / {user.dailyGoal} lessons</h3>
          </div>
        </div>
        <div className="mt-5 h-3 rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${dailyProgress}%` }} />
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-100 p-3 text-amber-500">
            <Trophy size={20} />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">League status</p>
            <h3 className="text-2xl font-black text-slate-900">Leaderboard ready</h3>
          </div>
        </div>
        <p className="mt-3 font-semibold text-slate-500">
          XP from finished sessions is stored in the database and reflected on the leaderboard page.
        </p>
        <button
          onClick={onViewLeaderboard}
          className="mt-5 w-full rounded-3xl bg-slate-900 px-4 py-4 font-black text-white shadow-[0_8px_0_0_#0f172a]"
        >
          View leaderboard
        </button>
      </section>
    </aside>
  );
};
