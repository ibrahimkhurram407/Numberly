import React from 'react';
import { motion } from 'motion/react';
import { Star, Check, Play, Lock, BookOpen } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NodeProps {
  status: 'completed' | 'current' | 'locked';
  index: number;
  label: string;
}

const PathNode = ({ status, index, label }: NodeProps) => {
  const isLeft = index % 2 === 0;
  const isCenter = index % 3 === 0;
  
  // Calculate horizontal offset
  const xOffset = isCenter ? 0 : (isLeft ? -40 : 40);

  return (
    <div 
      className="relative flex flex-col items-center my-6 group"
      style={{ transform: `translateX(${xOffset}px)` }}
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "w-16 h-16 rounded-3xl flex items-center justify-center relative shadow-[0_6px_0_0_rgba(0,0,0,0.1)] transition-all cursor-pointer z-10",
          status === 'completed' && "bg-sky-400 border-b-4 border-sky-600 text-white",
          status === 'current' && "bg-emerald-400 border-b-4 border-emerald-600 text-white",
          status === 'locked' && "bg-slate-200 border-b-4 border-slate-300 text-slate-400"
        )}
      >
        {status === 'completed' && <Check size={28} strokeWidth={3} />}
        {status === 'current' && <Play size={28} fill="white" />}
        {status === 'locked' && <Lock size={24} />}
        
        {status === 'current' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-12 bg-emerald-500 text-white px-3 py-1 rounded-lg font-bold text-sm whitespace-nowrap shadow-lg after:content-[''] after:absolute after:top-full after:left-1/2 after:-ml-2 after:border-8 after:border-transparent after:border-t-emerald-500"
          >
            START
          </motion.div>
        )}
      </motion.button>
      <span className="mt-3 font-bold text-slate-500 uppercase text-xs tracking-wider">{label}</span>
    </div>
  );
};

export const UnitSection = ({ unitNumber, title, description, color }: { unitNumber: number, title: string, description: string, color: string }) => {
  return (
    <div className="w-full max-w-lg mx-auto mb-12">
      <div className={cn("p-6 rounded-2xl mb-12 text-white shadow-lg", color)}>
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-xl font-black uppercase tracking-tight">Unit {unitNumber}</h2>
          <BookOpen className="opacity-50" size={24} />
        </div>
        <h3 className="text-2xl font-bold mb-1">{title}</h3>
        <p className="opacity-90 font-medium">{description}</p>
      </div>

      <div className="flex flex-col items-center">
        <PathNode status="completed" index={0} label="Shapes" />
        <PathNode status="completed" index={1} label="Matching" />
        <PathNode status="current" index={2} label="Counting 1-5" />
        <PathNode status="locked" index={3} label="Patterns" />
        <PathNode status="locked" index={4} label="Logic" />
      </div>
    </div>
  );
};

export const LessonPath = () => {
  return (
    <div className="flex-1 overflow-y-auto pt-24 pb-32 px-4 scroll-smooth">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        {/* Mascot Speech Bubble for Mobile/Small tablets */}
        <div className="xl:hidden w-full max-w-lg mb-8 flex items-center gap-4 bg-white border-2 border-slate-200 p-4 rounded-2xl">
           <div className="w-12 h-12 bg-slate-100 rounded-full shrink-0 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1703668929798-67cab2e41f6b?auto=format&fit=crop&q=80&w=100" alt="Mascot" className="w-full h-full object-cover" />
           </div>
           <p className="font-bold text-slate-600 text-sm">Keep up the momentum! You're doing amazing.</p>
        </div>

        <UnitSection 
          unitNumber={1} 
          title="Foundation" 
          description="Numbers and Basic Shapes" 
          color="bg-sky-500"
        />
        <UnitSection 
          unitNumber={2} 
          title="Logic & Order" 
          description="Understanding sequences and grouping" 
          color="bg-emerald-500"
        />
        <UnitSection 
          unitNumber={3} 
          title="Patterns" 
          description="Recognizing repeating sequences" 
          color="bg-orange-500"
        />
      </div>
    </div>
  );
};
