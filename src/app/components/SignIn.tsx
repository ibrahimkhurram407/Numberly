import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, ArrowRight, Github } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SignInProps {
  onSignIn: (username: string) => void;
}

export const SignIn = ({ onSignIn }: SignInProps) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onSignIn(username.trim());
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-xl border-2 border-slate-100"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-sky-500 rounded-3xl flex items-center justify-center mb-4 shadow-[0_6px_0_0_#0369a1]">
            <h1 className="text-4xl font-black text-white italic">N</h1>
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Pick a Name!</h2>
          <p className="text-slate-500 font-bold mt-2">Enter your name to start playing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-black text-slate-600 uppercase tracking-wider ml-2">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="What should we call you?"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-sky-400 focus:bg-white transition-all font-black text-slate-700 text-lg"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-2xl shadow-[0_6px_0_0_#059669] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2 text-xl cursor-pointer"
          >
            Start Learning <ArrowRight size={24} strokeWidth={3} />
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4 text-slate-300">
          <div className="flex-1 h-0.5 bg-slate-100" />
          <span className="font-black text-xs uppercase">or sign in with</span>
          <div className="flex-1 h-0.5 bg-slate-100" />
        </div>

        <div className="mt-6 flex gap-4">
          <button className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors font-bold text-slate-600 cursor-pointer">
            <Github size={20} /> Google
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors font-bold text-slate-600 cursor-pointer">
             Apple
          </button>
        </div>

        <p className="mt-8 text-center font-bold text-slate-500">
          Don't have an account? <button className="text-sky-500 hover:text-sky-600 cursor-pointer">Sign up</button>
        </p>
      </motion.div>
    </div>
  );
};
