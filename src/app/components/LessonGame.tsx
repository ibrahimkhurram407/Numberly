import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Heart, Volume2, X, XCircle } from 'lucide-react';

import { fetchQuestions, submitLesson } from '../api';
import { cn } from '../../lib/utils';
import type { Level, Question, UserProfile } from '../types';

interface LessonGameProps {
  level: Level;
  user: UserProfile;
  onExit: () => void;
  onLessonComplete: (user: UserProfile) => void;
}

export const LessonGame = ({ level, user, onExit, onLessonComplete }: LessonGameProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | number | null>(null);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong' | 'complete'>('idle');
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [heartsLeft, setHeartsLeft] = useState(user.hearts || 5);
  const [summary, setSummary] = useState<{ xpEarned: number; starsEarned: number; accuracy: number } | null>(null);

  const audioBasePath = `/audio/${user.settings.preferredVoice}`;

  useEffect(() => {
    fetchQuestions(level.id, 5)
      .then((response) => setQuestions(response.questions))
      .catch(() => setQuestions([]));
  }, [level.id]);

  const question = questions[currentIndex];
  const progress = questions.length ? ((currentIndex + (status === 'complete' ? 1 : 0)) / questions.length) * 100 : 0;
  const isImageSource = (value: string) => value.startsWith('/uploads/') || value.startsWith('http') || value.startsWith('data:image/');
  const isImageChoiceQuestion = Boolean(question?.visualType === 'imageChoices' && question.visualItems?.length === question.choices.length);

  const visuals = useMemo(() => {
    if (!question) {
      return null;
    }
    if (question.assetKind === 'image' && question.visualItems?.length === 1 && isImageSource(question.visualItems[0])) {
      return (
        <div
          className="flex w-full max-w-md flex-col items-center gap-4 rounded-[2rem] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
          title={question.assetObjectName ?? question.assetTitle ?? ''}
        >
          <img
            src={question.visualItems[0]}
            alt={question.assetObjectName ?? question.assetTitle ?? 'Lesson image'}
            className="h-56 w-full rounded-[1.5rem] object-cover"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        </div>
      );
    }

    if (question.visualItems) {
      return (
        <div className="flex flex-wrap justify-center gap-4">
          {question.visualItems.map((item, index) => (
            <motion.div
              key={`${item}-${index}`}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex h-24 w-24 items-center justify-center rounded-[1.8rem] bg-white text-5xl shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
            >
              {question.assetKind === 'image' && isImageSource(item) ? (
                <img
                  src={item}
                  alt={question.assetObjectName ?? 'Lesson object'}
                  className="h-20 w-20 rounded-2xl object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-center text-lg font-black text-slate-700">{item}</span>
              )}
            </motion.div>
          ))}
        </div>
      );
    }

    if (question.visualGroups) {
      return (
        <div className="flex flex-wrap items-center justify-center gap-6">
          {question.visualGroups.map((group, index) => (
            <div key={index} className="rounded-[1.8rem] bg-white px-6 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
              <div className="flex gap-3 text-4xl">
                {group.map((item, itemIndex) => (
                  question.assetKind === 'image' && isImageSource(item) ? (
                    <img
                      key={`${item}-${itemIndex}`}
                      src={item}
                      alt={question.assetObjectName ?? 'Lesson object'}
                      className="h-14 w-14 rounded-xl object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span key={`${item}-${itemIndex}`} className="text-center text-lg font-black text-slate-700">{item}</span>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (question.sequence) {
      return (
        <div className="flex justify-center gap-4">
          {question.sequence.map((entry, index) => (
            <div
              key={`${entry}-${index}`}
              className="flex h-24 w-24 items-center justify-center rounded-[1.8rem] bg-white text-4xl font-black text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
            >
              {entry}
            </div>
          ))}
          <div className="flex h-24 w-24 items-center justify-center rounded-[1.8rem] border-2 border-dashed border-slate-300 bg-white text-4xl font-black text-slate-400">
            ?
          </div>
        </div>
      );
    }

    return null;
  }, [question]);
  const hasVisuals = Boolean(visuals) && !isImageChoiceQuestion;

  const playAudioFile = async (fileName: string) => {
    try {
      const audio = new Audio(`${audioBasePath}/${fileName}`);
      await audio.play();
      return true;
    } catch {
      return false;
    }
  };

  const speakPrompt = () => {
    if (!question || !('speechSynthesis' in window) || !user.settings.soundEnabled) {
      return;
    }

    playAudioFile(`${level.lessonType}.mp3`).then((played) => {
      if (played) {
        return;
      }
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(question.narration));
    });
  };

  const advanceToNext = async () => {
    if (!question) {
      return;
    }

    if (currentIndex === questions.length - 1 || heartsLeft <= 0) {
      const response = await submitLesson({
        userId: user.id,
        levelId: level.id,
        correctAnswers,
        totalQuestions: questions.length,
        heartsLeft,
      });
      setSummary(response.session);
      onLessonComplete(response.user);
      setStatus('complete');
      return;
    }

    setCurrentIndex((value) => value + 1);
    setSelectedOption(null);
    setStatus('idle');
  };

  const handleCheck = async () => {
    if (selectedOption === null || !question) {
      return;
    }

    if (selectedOption === question.answer) {
      setCorrectAnswers((value) => value + 1);
      setStatus('correct');
      playAudioFile('correct.mp3').catch(() => undefined);
      return;
    }

    const nextHearts = Math.max(heartsLeft - 1, 0);
    setHeartsLeft(nextHearts);
    setStatus('wrong');
    playAudioFile('wrong.mp3').catch(() => undefined);

    if (nextHearts <= 0) {
      const response = await submitLesson({
        userId: user.id,
        levelId: level.id,
        correctAnswers,
        totalQuestions: questions.length,
        heartsLeft: nextHearts,
      });
      setSummary(response.session);
      onLessonComplete(response.user);
      setStatus('complete');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_35%,#fefce8_100%)] font-sans">
      <header className="mx-auto flex w-full max-w-5xl items-center gap-6 px-4 py-6">
        <button onClick={onExit} className="cursor-pointer p-1 text-slate-400 hover:text-slate-700">
          <X size={32} strokeWidth={3} />
        </button>

        <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100 shadow-inner">
          <motion.div animate={{ width: `${progress}%` }} className="h-full rounded-full bg-emerald-400" />
        </div>

        <div className="flex items-center gap-2 text-red-500">
          <Heart size={28} fill="currentColor" />
          <span className="text-xl font-black">{heartsLeft}</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-500">{level.unit}</p>
            <h1 className="mt-2 text-3xl font-black text-slate-800">{question?.prompt ?? 'Loading lesson...'}</h1>
          </div>

          <button
            type="button"
            onClick={speakPrompt}
            className="cursor-pointer rounded-2xl bg-white p-4 text-sky-500 shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
          >
            <Volume2 size={22} />
          </button>
        </div>

        {hasVisuals && (
          <div className="mt-8 flex flex-1 items-center justify-center rounded-[2rem] border-2 border-slate-100 bg-slate-50 p-6">
            {visuals}
          </div>
        )}

        <div className={`${hasVisuals ? 'mt-8' : 'mt-12'} ${isImageChoiceQuestion ? 'grid grid-cols-2 gap-5 sm:grid-cols-3' : 'grid grid-cols-2 gap-4 sm:grid-cols-4'}`}>
          {question?.choices.map((option, optionIndex) => {
            const optionVisual = question.visualItems?.[optionIndex];
            const showImageChoice = isImageChoiceQuestion && optionVisual;

            return (
              <button
                key={`${String(option)}-${currentIndex}-${optionIndex}`}
                disabled={status === 'complete'}
                onClick={() => setSelectedOption(option)}
                title={String(option)}
                className={cn(
                  showImageChoice
                    ? 'overflow-hidden rounded-[2rem] border-2 bg-white p-3 transition'
                    : 'rounded-[1.8rem] border-2 py-6 text-2xl font-black transition',
                  selectedOption === option ? 'border-sky-400 bg-sky-100 text-sky-700' : 'border-slate-200 bg-white text-slate-600',
                  status === 'correct' && option === question.answer && 'border-emerald-400 bg-emerald-100 text-emerald-700',
                  status === 'wrong' && option === selectedOption && 'border-red-400 bg-red-100 text-red-700',
                )}
              >
                {showImageChoice ? (
                  <div className="space-y-3">
                    {question.assetKind === 'image' && isImageSource(optionVisual) ? (
                      <img
                        src={optionVisual}
                        alt={String(option)}
                        className="h-44 w-full rounded-[1.4rem] object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-44 items-center justify-center rounded-[1.4rem] bg-slate-50 text-7xl">
                        {optionVisual}
                      </div>
                    )}
                  </div>
                ) : (
                  String(option)
                )}
              </button>
            );
          })}
        </div>
      </main>

      <footer
        className={cn(
          'border-t-2 px-4 py-6 transition-colors',
          status === 'correct' && 'border-emerald-200 bg-emerald-100',
          status === 'wrong' && 'border-red-200 bg-red-100',
          status !== 'correct' && status !== 'wrong' && 'border-slate-100 bg-white',
        )}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {status === 'correct' && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 text-emerald-700">
                  <div className="rounded-full bg-white p-2">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black">Great job!</h4>
                    <p className="font-bold opacity-80">Exactly right.</p>
                  </div>
                </motion.div>
              )}

              {status === 'wrong' && question && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 text-red-700">
                  <div className="rounded-full bg-white p-2">
                    <XCircle size={32} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black">Try again</h4>
                    <p className="font-bold opacity-80">Correct answer: {String(question.answer)}</p>
                  </div>
                </motion.div>
              )}

              {status === 'complete' && summary && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-slate-800">
                  <h4 className="text-2xl font-black">Lesson complete</h4>
                  <p className="font-bold text-slate-500">
                    +{summary.xpEarned} XP, {summary.starsEarned} stars, {summary.accuracy}% accuracy
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={status === 'idle' ? handleCheck : status === 'complete' ? onExit : advanceToNext}
            disabled={selectedOption === null && status === 'idle'}
            className={cn(
              'rounded-3xl px-8 py-4 text-xl font-black uppercase tracking-[0.16em] transition',
              selectedOption === null && status === 'idle'
                ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                : 'bg-slate-900 text-white shadow-[0_8px_0_0_#0f172a]',
            )}
          >
            {status === 'idle' ? 'Check' : status === 'complete' ? 'Back to lessons' : 'Continue'}
          </button>
        </div>
      </footer>
    </div>
  );
};
