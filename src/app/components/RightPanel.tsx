import React from 'react';
import { Trophy, Target, ShieldCheck } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const Mascot = "https://images.unsplash.com/photo-1703668929798-67cab2e41f6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwY2FydG9vbiUyMHJvYm90fGVufDF8fHx8MTc3MDczMjUxNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

export const RightPanel = () => {
  return (
    <aside className="hidden xl:flex flex-col gap-6 w-80 p-6 pt-24 border-l border-slate-100 h-full overflow-y-auto">
      {/* Mascot encouragement */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 flex gap-4 items-center">
        <div className="w-16 h-16 shrink-0">
            <ImageWithFallback 
                src={Mascot} 
                alt="Robot Mascot" 
                className="w-full h-full object-cover rounded-xl"
            />
        </div>
        <div>
          <p className="font-bold text-slate-700 leading-tight">Great job today! You've solved 15 math puzzles.</p>
        </div>
      </div>

      {/* Daily Quests */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-slate-700 text-lg uppercase">Daily Quests</h3>
          <span className="text-sky-500 font-bold text-sm cursor-pointer hover:underline">VIEW ALL</span>
        </div>
        
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="bg-yellow-100 p-2 rounded-lg shrink-0">
              <Target className="text-yellow-600" size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-700 text-sm">Earn 50 XP</p>
              <div className="h-3 bg-slate-100 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-yellow-400 w-[60%]" />
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="bg-orange-100 p-2 rounded-lg shrink-0">
              <ShieldCheck className="text-orange-600" size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-700 text-sm">3 Perfect Lessons</p>
              <div className="h-3 bg-slate-100 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-orange-400 w-[33%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* League */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <Trophy className="text-indigo-500" size={32} />
          <div>
            <h3 className="font-black text-slate-700 text-lg uppercase leading-none">Ruby League</h3>
            <p className="text-slate-400 text-sm font-bold uppercase mt-1">15th Place</p>
          </div>
        </div>
        <button className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors cursor-pointer">
          VIEW LEADERBOARD
        </button>
      </div>
    </aside>
  );
};
