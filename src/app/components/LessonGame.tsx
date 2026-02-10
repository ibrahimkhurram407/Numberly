import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, CheckCircle2, XCircle, Volume2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface LessonGameProps {
  onExit: () => void;
}

const APPLE_IMAGE = "https://images.unsplash.com/photo-1716802043669-8aabd339dc00?auto=format&fit=crop&q=80&w=200";

export const LessonGame = ({ onExit }: LessonGameProps) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'checking' | 'correct' | 'wrong'>('idle');
  const [progress, setProgress] = useState(30);

  const options = [2, 3, 4, 5];
  const correctAnswer = 3;

  const handleCheck = () => {
    if (selectedOption === null) return;
    
    if (selectedOption === correctAnswer) {
      setStatus('correct');
      // In a real app, we'd play a sound and move to next after a delay
    } else {
      setStatus('wrong');
    }
  };

  const handleContinue = () => {
    if (status === 'correct') {
      setProgress(prev => Math.min(prev + 20, 100));
    }
    setStatus('idle');
    setSelectedOption(null);
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col font-sans">
      {/* Game Header */}
      <header className="max-w-5xl mx-auto w-full px-4 py-6 flex items-center gap-6">
        <button 
          onClick={onExit}
          className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
        >
          <X size={32} strokeWidth={3} />
        </button>
        
        <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <motion.div 
            initial={{ width: '30%' }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-emerald-400 rounded-full"
          />
        </div>

        <div className="flex items-center gap-2 text-red-500">
          <Heart size={28} fill="currentColor" />
          <span className="font-black text-xl">5</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col">
        <h1 className="text-3xl font-black text-slate-700 mb-8 leading-tight">
          How many apples are there?
        </h1>

        {/* Sensory support: Visuals */}
        <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-3xl mb-12 border-2 border-slate-100 relative overflow-hidden">
          <div className="flex gap-6 flex-wrap justify-center p-8">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.1, type: 'spring' }}
                className="w-32 h-32"
              >
                <ImageWithFallback 
                  src={APPLE_IMAGE} 
                  alt="Apple" 
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </motion.div>
            ))}
          </div>
          
          <button className="absolute bottom-4 right-4 p-3 bg-white shadow-md rounded-2xl text-sky-500 hover:bg-sky-50 transition-colors">
            <Volume2 size={24} />
          </button>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-32">
          {options.map((option) => (
            <button
              key={option}
              disabled={status !== 'idle'}
              onClick={() => setSelectedOption(option)}
              className={cn(
                "py-6 rounded-2xl text-2xl font-black border-2 transition-all transform active:scale-95 cursor-pointer",
                selectedOption === option 
                  ? "bg-sky-100 border-sky-400 text-sky-600 shadow-[0_4px_0_0_#38bdf8]" 
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-[0_4px_0_0_#e2e8f0]",
                status === 'correct' && option === correctAnswer && "bg-emerald-100 border-emerald-500 text-emerald-600 shadow-[0_4px_0_0_#10b981]",
                status === 'wrong' && option === selectedOption && "bg-red-100 border-red-500 text-red-600 shadow-[0_4px_0_0_#ef4444]"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </main>

      {/* Bottom Action Bar */}
      <footer className={cn(
        "py-8 px-4 border-t-2 transition-colors duration-300",
        status === 'idle' && "bg-white border-slate-100",
        status === 'correct' && "bg-emerald-100 border-emerald-200",
        status === 'wrong' && "bg-red-100 border-red-200",
        status === 'checking' && "bg-white border-slate-100"
      )}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {status === 'correct' && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 text-emerald-700"
                >
                  <div className="bg-white p-2 rounded-full">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black">Great job!</h4>
                    <p className="font-bold opacity-80">Exactly right.</p>
                  </div>
                </motion.div>
              )}
              {status === 'wrong' && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 text-red-700"
                >
                  <div className="bg-white p-2 rounded-full">
                    <XCircle size={32} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black">Not quite...</h4>
                    <p className="font-bold opacity-80 text-sm">Correct answer: {correctAnswer}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={status === 'idle' ? handleCheck : handleContinue}
            disabled={selectedOption === null && status === 'idle'}
            className={cn(
              "px-12 py-4 rounded-2xl font-black text-xl uppercase tracking-wider transition-all cursor-pointer",
              status === 'idle' 
                ? (selectedOption === null 
                    ? "bg-slate-200 text-slate-400" 
                    : "bg-emerald-500 text-white shadow-[0_4px_0_0_#059669] hover:bg-emerald-400 active:shadow-none translate-y-0 active:translate-y-1")
                : (status === 'correct' 
                    ? "bg-emerald-500 text-white shadow-[0_4px_0_0_#059669] hover:bg-emerald-400" 
                    : "bg-red-500 text-white shadow-[0_4px_0_0_#dc2626] hover:bg-red-400")
            )}
          >
            {status === 'idle' ? 'Check' : 'Continue'}
          </button>
        </div>
      </footer>
    </div>
  );
};
