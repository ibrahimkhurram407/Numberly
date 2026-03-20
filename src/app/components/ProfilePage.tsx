import React, { useState } from 'react';
import { Save } from 'lucide-react';

import { updateProfile } from '../api';
import type { UserProfile } from '../types';

interface ProfilePageProps {
  user: UserProfile;
  onUserChange: (user: UserProfile) => void;
}

const avatarColors = ['#0ea5e9', '#14b8a6', '#f97316', '#8b5cf6', '#ef4444'];
const ageGroups = ['3-5', '5-7', '7-9', '10-12', '13-17', '18-24', '25-39', '40+'];

export const ProfilePage = ({ user, onUserChange }: ProfilePageProps) => {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [ageGroup, setAgeGroup] = useState(user.ageGroup);
  const [dailyGoal, setDailyGoal] = useState(user.dailyGoal);
  const [avatarColor, setAvatarColor] = useState(user.avatarColor);
  const [message, setMessage] = useState('');

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await updateProfile(user.id, { displayName, ageGroup, dailyGoal, avatarColor });
    onUserChange(response.user);
    setMessage('Profile updated.');
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-32 pt-28 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="rounded-[2rem] border-2 border-slate-100 bg-white p-8 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-[2rem] text-3xl font-black text-white shadow-[0_8px_0_0_rgba(15,23,42,0.12)]"
                style={{ backgroundColor: avatarColor }}
              >
                {user.displayName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-500">Account page</p>
                <h1 className="text-4xl font-black tracking-tight text-slate-900">{user.displayName}</h1>
                <p className="mt-2 font-semibold text-slate-500">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-3xl bg-sky-50 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-500">XP</p>
                <p className="mt-2 text-2xl font-black text-slate-800">{user.totalXp}</p>
              </div>
              <div className="rounded-3xl bg-amber-50 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-500">Streak</p>
                <p className="mt-2 text-2xl font-black text-slate-800">{user.streakDays}</p>
              </div>
              <div className="rounded-3xl bg-emerald-50 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-500">Hearts</p>
                <p className="mt-2 text-2xl font-black text-slate-800">{user.hearts}</p>
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={handleSave} className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] border-2 border-slate-100 bg-white p-8 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black text-slate-900">Learner details</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-black uppercase tracking-[0.18em] text-slate-500">Display name</span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="w-full rounded-3xl border-2 border-slate-100 bg-slate-50 px-4 py-4 font-bold text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-black uppercase tracking-[0.18em] text-slate-500">Age group</span>
                <select
                  value={ageGroup}
                  onChange={(event) => setAgeGroup(event.target.value)}
                  className="w-full rounded-3xl border-2 border-slate-100 bg-slate-50 px-4 py-4 font-bold text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white"
                >
                  {ageGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-black uppercase tracking-[0.18em] text-slate-500">Daily goal</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={dailyGoal}
                  onChange={(event) => setDailyGoal(Number(event.target.value))}
                  className="w-full rounded-3xl border-2 border-slate-100 bg-slate-50 px-4 py-4 font-bold text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-6 inline-flex items-center gap-2 rounded-3xl bg-slate-900 px-6 py-4 font-black text-white shadow-[0_8px_0_0_#0f172a]"
            >
              <Save size={18} />
              Save profile
            </button>

            {message && <p className="mt-4 font-bold text-emerald-600">{message}</p>}
          </section>

          <section className="rounded-[2rem] border-2 border-slate-100 bg-white p-8 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black text-slate-900">Avatar color</h2>
            <div className="mt-6 grid grid-cols-5 gap-3">
              {avatarColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAvatarColor(color)}
                  className={`h-14 rounded-2xl border-4 transition ${avatarColor === color ? 'border-slate-900' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="mt-8 rounded-[2rem] bg-slate-50 p-5">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Completed lessons</p>
              <p className="mt-3 text-4xl font-black text-slate-900">{user.progress.length}</p>
              <p className="mt-2 font-semibold text-slate-500">Each completed lesson updates MySQL and the leaderboard.</p>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
};
