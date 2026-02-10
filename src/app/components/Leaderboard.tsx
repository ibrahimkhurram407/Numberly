import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Star, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface LeaderboardProps {
  currentUsername: string;
}

export const Leaderboard = ({ currentUsername }: LeaderboardProps) => {
  const LEADERBOARD_DATA = [
    { id: 1, name: currentUsername || 'You', points: 2840, rank: 3, avatar: 'https://images.unsplash.com/photo-1740252117027-4275d3f84385?auto=format&fit=crop&q=80&w=100', isUser: true },
    { id: 2, name: 'Alex M.', points: 3120, rank: 1, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100' },
    { id: 3, name: 'Sarah J.', points: 2950, rank: 2, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100' },
    { id: 4, name: 'Leo R.', points: 2430, rank: 4, avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100' },
    { id: 5, name: 'Emma W.', points: 2100, rank: 5, avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=100' },
    { id: 6, name: 'Noah B.', points: 1950, rank: 6, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100' },
    { id: 7, name: 'Mia L.', points: 1820, rank: 7, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100' },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-3xl mb-4 text-amber-500 shadow-[0_4px_0_0_#f59e0b]">
            <Trophy size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Ruby League</h1>
          <p className="text-slate-500 font-bold mt-2">Finish in the top 5 to advance!</p>
        </header>

        {/* Top 3 Podium Cards */}
        <div className="flex items-end justify-center gap-4 mb-12">
          {/* Silver */}
          <div className="flex flex-col items-center">
             <div className="w-16 h-16 rounded-full border-4 border-slate-200 overflow-hidden mb-2">
                <ImageWithFallback src={LEADERBOARD_DATA[2].avatar} alt="Rank 2" className="w-full h-full object-cover" />
             </div>
             <div className="bg-slate-50 w-24 h-24 rounded-t-2xl border-2 border-b-0 border-slate-100 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-400">2</span>
             </div>
          </div>
          {/* Gold */}
          <div className="flex flex-col items-center translate-y-[-16px]">
             <Medal size={32} className="text-amber-500 mb-1" />
             <div className="w-20 h-20 rounded-full border-4 border-amber-400 overflow-hidden mb-2 shadow-lg">
                <ImageWithFallback src={LEADERBOARD_DATA[1].avatar} alt="Rank 1" className="w-full h-full object-cover" />
             </div>
             <div className="bg-amber-50 w-28 h-32 rounded-t-2xl border-2 border-b-0 border-amber-200 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-amber-500">1</span>
             </div>
          </div>
          {/* Bronze */}
          <div className="flex flex-col items-center">
             <div className="w-16 h-16 rounded-full border-4 border-orange-200 overflow-hidden mb-2">
                <ImageWithFallback src={LEADERBOARD_DATA[0].avatar} alt="Rank 3" className="w-full h-full object-cover" />
             </div>
             <div className="bg-orange-50 w-24 h-20 rounded-t-2xl border-2 border-b-0 border-orange-100 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-orange-500">3</span>
             </div>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="space-y-3">
          {LEADERBOARD_DATA.map((user, idx) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-[1.5rem] border-2 transition-all",
                user.isUser 
                  ? "bg-sky-50 border-sky-200 shadow-[0_4px_0_0_#bae6fd]" 
                  : "bg-white border-slate-100 hover:border-slate-200 shadow-[0_4px_0_0_#f1f5f9]"
              )}
            >
              <span className={cn(
                "w-8 text-center font-black text-xl",
                user.rank <= 3 ? "text-slate-800" : "text-slate-400"
              )}>
                {user.rank}
              </span>
              
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-slate-100">
                <ImageWithFallback src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1">
                <h4 className="font-black text-slate-700 text-lg">{user.name}</h4>
                {user.isUser && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-500 bg-sky-100 px-2 py-0.5 rounded-full">
                    That's You!
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-amber-500 bg-amber-50 px-4 py-2 rounded-xl border-2 border-amber-100">
                <Star size={18} fill="currentColor" />
                <span className="font-black text-lg">{user.points}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Promotion Zone Message */}
        <div className="mt-8 p-6 bg-emerald-50 rounded-[2rem] border-2 border-emerald-100 flex items-center gap-4">
           <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-[0_4px_0_0_#059669]">
              <TrendingUp size={24} />
           </div>
           <div>
              <p className="font-black text-emerald-700">Promotion Zone</p>
              <p className="font-bold text-emerald-600 text-sm opacity-80">You're on track to advance to the next league!</p>
           </div>
        </div>
      </div>
    </div>
  );
};
