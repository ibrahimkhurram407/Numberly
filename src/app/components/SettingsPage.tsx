import React, { useState } from 'react';

import { updateSettings } from '../api';
import type { UserProfile, UserSettings } from '../types';

interface SettingsPageProps {
  user: UserProfile;
  onUserChange: (user: UserProfile) => void;
}

const settingCards = [
  { key: 'soundEnabled', title: 'Gentle sound cues', description: 'Keeps spoken prompts and sound feedback active.' },
  { key: 'highContrast', title: 'High contrast mode', description: 'Strengthens visual separation for important controls.' },
  { key: 'routineMode', title: 'Routine-first learning', description: 'Keeps the lesson pattern consistent from round to round.' },
] as const;

export const SettingsPage = ({ user, onUserChange }: SettingsPageProps) => {
  const [settings, setSettings] = useState<UserSettings>(user.settings);
  const [message, setMessage] = useState('');

  const handleToggle = (key: keyof UserSettings) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleSave = async () => {
    const response = await updateSettings(user.id, settings);
    onUserChange(response.user);
    setMessage('Settings updated.');
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-32 pt-28 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="rounded-[2rem] border-2 border-slate-100 bg-white p-8 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-500">Settings page</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">Supportive learning preferences</h1>
          <p className="mt-3 max-w-2xl font-semibold text-slate-500">
            These switches are stored in MySQL so the child gets the same learning environment the next time they sign in.
          </p>
        </section>

        <section className="grid gap-5">
          {settingCards.map((card) => {
            const enabled = Boolean(settings[card.key]);
            return (
              <div key={card.key} className="flex flex-col gap-4 rounded-[2rem] border-2 border-slate-100 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{card.title}</h2>
                  <p className="mt-2 font-semibold text-slate-500">{card.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle(card.key)}
                  className={`relative h-14 w-28 rounded-full border-2 transition ${
                    enabled ? 'border-emerald-500 bg-emerald-500' : 'border-slate-200 bg-slate-200'
                  }`}
                >
                  <span
                    className={`absolute top-1.5 h-10 w-10 rounded-full bg-white transition ${
                      enabled ? 'left-[58px]' : 'left-1.5'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </section>

        <section className="rounded-[2rem] border-2 border-slate-100 bg-white p-8 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <label className="block">
            <span className="mb-2 block text-sm font-black uppercase tracking-[0.18em] text-slate-500">Prompt voice</span>
            <select
              value={settings.preferredVoice}
              onChange={(event) => setSettings((current) => ({ ...current, preferredVoice: event.target.value }))}
              className="w-full rounded-3xl border-2 border-slate-100 bg-slate-50 px-4 py-4 font-bold text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white"
            >
              <option value="gentle">Gentle</option>
              <option value="playful">Playful</option>
              <option value="calm">Calm</option>
            </select>
          </label>

          <button
            type="button"
            onClick={handleSave}
            className="mt-6 rounded-3xl bg-slate-900 px-6 py-4 font-black text-white shadow-[0_8px_0_0_#0f172a]"
          >
            Save settings
          </button>

          {message && <p className="mt-4 font-bold text-emerald-600">{message}</p>}
        </section>
      </div>
    </div>
  );
};
