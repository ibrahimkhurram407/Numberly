import React from 'react';
import { Home, Trophy, BookOpen, ShoppingBag, User, MoreHorizontal, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const NavItem = ({ icon: Icon, label, active, onClick }: NavItemProps & { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-4 px-4 py-3 rounded-xl transition-all w-full cursor-pointer",
      active 
        ? "bg-sky-100 text-sky-600 border-2 border-sky-300" 
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-2 border-transparent"
    )}
  >
    <Icon size={24} strokeWidth={2.5} />
    <span className="font-bold text-lg uppercase tracking-wide hidden lg:block">{label}</span>
  </button>
);

export const Sidebar = ({ currentPage, onPageChange }: SidebarProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-around items-center lg:relative lg:flex-col lg:justify-start lg:gap-2 lg:h-full lg:w-64 lg:border-r lg:border-t-0 lg:p-4 z-50">
      <div className="hidden lg:block mb-8 px-4">
        <h1 className="text-3xl font-black text-sky-500 tracking-tight">NUMBΞRLY</h1>
      </div>
      
      <NavItem icon={Home} label="Learn" active={currentPage === 'learn'} onClick={() => onPageChange('learn')} />
      <NavItem icon={Trophy} label="Leaderboard" active={currentPage === 'leaderboard'} onClick={() => onPageChange('leaderboard')} />
      <NavItem icon={BookOpen} label="Practice" active={currentPage === 'practice'} onClick={() => onPageChange('practice')} />
      <NavItem icon={ShoppingBag} label="Shop" active={currentPage === 'shop'} onClick={() => onPageChange('shop')} />
      <NavItem icon={User} label="Profile" active={currentPage === 'profile'} onClick={() => onPageChange('profile')} />
      <NavItem icon={Settings} label="Settings" active={currentPage === 'settings'} onClick={() => onPageChange('settings')} />
      
      <div className="hidden lg:flex mt-auto w-full px-4 text-slate-400 text-xs gap-4 py-4">
        <span>About</span>
        <span>Terms</span>
        <span>Privacy</span>
      </div>
    </nav>
  );
};
