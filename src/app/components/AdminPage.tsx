import React, { useEffect, useState } from 'react';

import { deleteAdminUser, fetchAdminUsers, resetAdminUserPassword, updateAdminUser } from '../api';
import type { AdminUserRecord, UserProfile } from '../types';

export const AdminPage = ({ user }: { user: UserProfile }) => {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [message, setMessage] = useState('');
  const [passwordDrafts, setPasswordDrafts] = useState<Record<number, string>>({});

  const refresh = async () => {
    const response = await fetchAdminUsers(user.id);
    setUsers(response.users);
  };

  useEffect(() => {
    if (user.role === 'admin') {
      refresh().catch(() => undefined);
    }
  }, [user.id, user.role]);

  if (user.role !== 'admin') {
    return <div className="flex-1 p-10 text-center font-bold text-slate-500">Admin access required.</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-32 pt-28 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] border-2 border-slate-100 bg-white p-8 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <h1 className="text-4xl font-black text-slate-900">Admin user control</h1>
          <p className="mt-3 font-semibold text-slate-500">Adjust roles, add hearts, reset passwords, and remove accounts.</p>
          {message && <p className="mt-4 font-bold text-emerald-600">{message}</p>}
        </section>

        <section className="grid gap-4">
          {users.map((entry) => (
            <div key={entry.id} className="rounded-[2rem] border-2 border-slate-100 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{entry.displayName}</h2>
                  <p className="font-semibold text-slate-500">{entry.email}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <input
                    type="number"
                    defaultValue={entry.hearts}
                    min={0}
                    onBlur={async (event) => {
                      await updateAdminUser(user.id, entry.id, { hearts: Number(event.target.value), role: entry.role, dailyGoal: entry.dailyGoal });
                      setMessage(`Updated hearts for ${entry.displayName}.`);
                      refresh().catch(() => undefined);
                    }}
                    className="rounded-3xl border-2 border-slate-100 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none"
                  />
                  <select
                    defaultValue={entry.role}
                    onChange={async (event) => {
                      await updateAdminUser(user.id, entry.id, { hearts: entry.hearts, role: event.target.value as 'admin' | 'user', dailyGoal: entry.dailyGoal });
                      setMessage(`Updated role for ${entry.displayName}.`);
                      refresh().catch(() => undefined);
                    }}
                    className="rounded-3xl border-2 border-slate-100 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                  <button
                    type="button"
                    onClick={async () => {
                      const nextPassword = passwordDrafts[entry.id]?.trim();
                      if (!nextPassword) {
                        setMessage(`Enter a new password for ${entry.displayName} first.`);
                        return;
                      }
                      await resetAdminUserPassword(user.id, entry.id, nextPassword);
                      setPasswordDrafts((current) => ({ ...current, [entry.id]: '' }));
                      setMessage(`Password for ${entry.displayName} was updated.`);
                    }}
                    className="rounded-3xl bg-amber-400 px-4 py-3 font-black text-white"
                  >
                    Reset Password
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <input
                  type="text"
                  value={passwordDrafts[entry.id] ?? ''}
                  onChange={(event) => setPasswordDrafts((current) => ({ ...current, [entry.id]: event.target.value }))}
                  placeholder="New password"
                  className="rounded-3xl border-2 border-slate-100 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none md:min-w-72"
                />
                <button
                  type="button"
                  onClick={async () => {
                    await deleteAdminUser(user.id, entry.id);
                    setMessage(`Deleted ${entry.displayName}.`);
                    refresh().catch(() => undefined);
                  }}
                  className="rounded-3xl bg-red-500 px-4 py-3 font-black text-white"
                >
                  Delete User
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};
