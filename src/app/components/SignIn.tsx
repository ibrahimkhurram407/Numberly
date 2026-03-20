import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, KeyRound, Mail, UserRound } from 'lucide-react';

import { loginUser, registerUser } from '../api';
import type { UserProfile } from '../types';

interface SignInProps {
  onSignedIn: (user: UserProfile) => void;
}

const ageGroups = ['3-5', '5-7', '7-9', '10-12', '13-17', '18-24', '25-39', '40+'];

export const SignIn = ({ onSignedIn }: SignInProps) => {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ageGroup, setAgeGroup] = useState('5-7');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response =
        mode === 'register'
          ? await registerUser({ displayName, email, password, ageGroup })
          : await loginUser({ email, password });

      onSignedIn(response.user);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to continue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#e0f2fe_0%,#fefce8_48%,#ffffff_100%)] flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl overflow-hidden rounded-[2rem] border-2 border-sky-100 bg-white shadow-[0_30px_80px_rgba(14,165,233,0.18)]"
      >
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <section className="bg-[radial-gradient(circle_at_top,#0ea5e9_0%,#0284c7_38%,#082f49_100%)] p-8 text-white lg:p-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 text-3xl font-black shadow-[0_6px_0_0_rgba(255,255,255,0.12)]">
              N
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">Numberly</h1>
            <p className="mt-4 max-w-md text-lg font-medium text-sky-50/90">
              A calm maths journey for autistic children with clear routines, gentle feedback, and repeatable lessons.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ['Guided play', 'Clear, low-stress maths activities'],
                ['Fresh lessons', 'Questions change each time you play'],
                ['Progress saved', 'Account progress and scores are remembered'],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-100">{title}</p>
                  <p className="mt-2 font-semibold text-white/90">{copy}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="p-8 lg:p-12">
            <div className="flex items-center gap-3 rounded-full bg-slate-100 p-1">
              {(['register', 'login'] as const).map((entry) => (
                <button
                  key={entry}
                  onClick={() => setMode(entry)}
                  className={`flex-1 rounded-full px-4 py-3 text-sm font-black uppercase tracking-[0.18em] transition ${
                    mode === entry ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {entry === 'register' ? 'Create Account' : 'Login'}
                </button>
              ))}
            </div>

            <div className="mt-8">
              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                {mode === 'register' ? 'Create a learner account' : 'Welcome back'}
              </h2>
              <p className="mt-2 font-medium text-slate-500">
                {mode === 'register'
                  ? 'Create a learner profile and keep progress saved between sessions.'
                  : 'Use the learner email and password you already created.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {mode === 'register' && (
                <label className="block">
                  <span className="mb-2 block text-sm font-black uppercase tracking-[0.18em] text-slate-500">Display name</span>
                  <div className="relative">
                    <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="What should the child be called?"
                      className="w-full rounded-3xl border-2 border-slate-100 bg-slate-50 py-4 pl-12 pr-4 font-bold text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white"
                      required
                    />
                  </div>
                </label>
              )}

              <label className="block">
                <span className="mb-2 block text-sm font-black uppercase tracking-[0.18em] text-slate-500">Email</span>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="learner@example.com"
                    className="w-full rounded-3xl border-2 border-slate-100 bg-slate-50 py-4 pl-12 pr-4 font-bold text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-black uppercase tracking-[0.18em] text-slate-500">Password</span>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Choose a safe password"
                    className="w-full rounded-3xl border-2 border-slate-100 bg-slate-50 py-4 pl-12 pr-4 font-bold text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white"
                    required
                  />
                </div>
              </label>

              {mode === 'register' && (
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
              )}

              {error && (
                <div className="rounded-3xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-3xl bg-emerald-500 px-6 py-4 text-lg font-black text-white shadow-[0_8px_0_0_#059669] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Sign in'}
                <ArrowRight size={20} />
              </button>
            </form>
          </section>
        </div>
      </motion.div>
    </div>
  );
};
