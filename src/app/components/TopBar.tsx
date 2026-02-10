import React from 'react';
import { Flame, Star, Heart } from 'lucide-react';

interface StatProps {
  icon: React.ElementType;
  value: string | number;
  colorClass: string;
}

const Stat = ({ icon: Icon, value, colorClass }: StatProps) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-slate-100 bg-white/50 backdrop-blur-sm`}>
    <Icon className={colorClass} size={22} fill="currentColor" />
    <span className={`font-bold text-slate-700`}>{value}</span>
  </div>
);

export const TopBar = () => {
  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Stat icon={Flame} value="12" colorClass="text-orange-500" />
          <div className="hidden md:flex flex-col w-32 ml-2">
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
              <span>Daily Goal</span>
              <span>80%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-sky-400 w-[80%] rounded-full" />
            </div>
          </div>
          <Stat icon={Star} value="450" colorClass="text-yellow-500" />
          <Stat icon={Heart} value="5" colorClass="text-red-500" />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-indigo-200" />
          <span className="font-bold text-slate-600 hidden sm:block">Math Explorer</span>
        </div>
      </div>
    </header>
  );
};
