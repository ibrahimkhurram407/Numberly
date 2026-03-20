import React from 'react';
import { Check, Lock, Play } from 'lucide-react';
import { motion } from 'motion/react';

import { cn } from '../../lib/utils';
import type { Level, UserProfile } from '../types';

interface LessonPathProps {
  levels: Level[];
  user: UserProfile;
  onStartLesson: (level: Level) => void;
}

function accentClasses(accent: string) {
  switch (accent) {
    case 'emerald':
      return 'bg-emerald-500';
    case 'orange':
      return 'bg-orange-500';
    case 'violet':
      return 'bg-violet-500';
    case 'sky':
    default:
      return 'bg-sky-500';
  }
}

export const LessonPath = ({ levels, user, onStartLesson }: LessonPathProps) => {
  const completedLevelIds = new Set(user.progress.filter((entry) => entry.timesCompleted > 0).map((entry) => entry.levelId));

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-32 pt-28 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-[2rem] border-2 border-slate-100 bg-[linear-gradient(135deg,#f0f9ff_0%,#ffffff_45%,#fefce8_100%)] p-8 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-500">Lesson journey</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">Emotion, routine, social, and number practice</h1>
          <p className="mt-3 max-w-2xl font-semibold text-slate-500">
            Lessons now focus on areas many autistic children benefit from practicing: recognising emotions, following routines, understanding kind choices, and building early maths confidence.
          </p>
        </section>

        <div className="mt-8 grid gap-6">
          {levels.map((level, index) => {
            const isCompleted = completedLevelIds.has(level.id);
            const isUnlocked = index === 0 || completedLevelIds.has(levels[index - 1].id);

            return (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-[2rem] border-2 border-slate-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className={cn('flex h-16 w-16 items-center justify-center rounded-[1.5rem] text-white shadow-[0_8px_0_0_rgba(15,23,42,0.12)]', accentClasses(level.accent))}>
                      {isCompleted ? <Check size={28} /> : isUnlocked ? <Play size={28} fill="currentColor" /> : <Lock size={26} />}
                    </div>

                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">{level.unit}</p>
                      <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-900">{level.title}</h2>
                      <p className="mt-2 max-w-2xl font-semibold text-slate-500">{level.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                      {level.lessonType}
                    </span>
                    <button
                      disabled={!isUnlocked}
                      onClick={() => onStartLesson(level)}
                      className={cn(
                        'rounded-3xl px-6 py-4 font-black shadow-[0_8px_0_0_rgba(15,23,42,0.12)] transition',
                        isUnlocked
                          ? 'bg-slate-900 text-white hover:bg-slate-800'
                          : 'cursor-not-allowed bg-slate-200 text-slate-400 shadow-none',
                      )}
                    >
                      {isCompleted ? 'Play Again' : isUnlocked ? 'Start Lesson' : 'Locked'}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
