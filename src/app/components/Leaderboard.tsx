import React, { useEffect, useState } from 'react';
import { Medal, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

import { fetchLeaderboard } from '../api';
import type { LeaderboardEntry, UserProfile } from '../types';
import { cn } from '../../lib/utils';

interface LeaderboardProps {
  user: UserProfile;
}

export const Leaderboard = ({ user }: LeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    fetchLeaderboard().then((response) => setEntries(response.leaderboard)).catch(() => setEntries([]));
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-32 pt-28 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-[2rem] bg-[linear-gradient(135deg,#fef3c7_0%,#ffffff_100%)] p-8 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-4">
            <div className="rounded-[1.5rem] bg-amber-400 p-4 text-white shadow-[0_8px_0_0_#d97706]">
              <Trophy size={28} />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-500">Leaderboard</p>
              <h1 className="text-4xl font-black tracking-tight text-slate-900">Database-backed rankings</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl font-semibold text-slate-500">
            This page now reads real learner totals from MySQL after lessons are completed.
          </p>
        </section>

        <div className="mt-8 space-y-4">
          {entries.map((entry, index) => {
            const isCurrentUser = entry.id === user.id;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'flex flex-col gap-4 rounded-[2rem] border-2 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center',
                  isCurrentUser ? 'border-sky-200 bg-sky-50' : 'border-slate-100 bg-white',
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-slate-900 text-xl font-black text-white">
                    {entry.rank <= 3 ? <Medal size={22} /> : entry.rank}
                  </div>
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] text-xl font-black text-white"
                    style={{ backgroundColor: entry.avatarColor }}
                  >
                    {entry.displayName.slice(0, 1).toUpperCase()}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-slate-900">{entry.displayName}</h2>
                    {isCurrentUser && (
                      <span className="rounded-full bg-sky-200 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-sky-700">
                        You
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-semibold text-slate-500">Streak: {entry.streakDays} days</p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:min-w-56">
                  <div className="rounded-2xl bg-white px-4 py-3 text-center">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Rank</p>
                    <p className="mt-1 text-2xl font-black text-slate-900">#{entry.rank}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 text-center">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">XP</p>
                    <p className="mt-1 text-2xl font-black text-slate-900">{entry.totalXp}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {entries.length === 0 && (
            <div className="rounded-[2rem] border-2 border-dashed border-slate-200 bg-white p-8 text-center font-semibold text-slate-500">
              Create an account and finish a lesson to populate the leaderboard.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
