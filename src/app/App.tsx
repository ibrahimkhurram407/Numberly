import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { LessonPath } from './components/LessonPath';
import { RightPanel } from './components/RightPanel';
import { LessonGame } from './components/LessonGame';
import { Leaderboard } from './components/Leaderboard';
import { SignIn } from './components/SignIn';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPage, setCurrentPage] = useState('learn');

  const handleSignIn = (name: string) => {
    setUsername(name);
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <SignIn onSignIn={handleSignIn} />;
  }

  if (isPlaying) {
    return <LessonGame onExit={() => setIsPlaying(false)} />;
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'learn':
        return (
          <div className="flex h-full">
            <div className="flex-1 h-full overflow-hidden flex flex-col">
              <div onClick={() => setIsPlaying(true)} className="contents">
                <LessonPath />
              </div>
            </div>
            <RightPanel />
          </div>
        );
      case 'leaderboard':
        return <Leaderboard currentUsername={username} />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-400 uppercase tracking-widest mb-4">Coming Soon</h2>
              <button 
                onClick={() => setCurrentPage('learn')}
                className="bg-sky-500 text-white px-8 py-3 rounded-2xl font-black shadow-[0_4px_0_0_#0369a1] active:shadow-none active:translate-y-1 transition-all cursor-pointer"
              >
                Back to Learning
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-white font-sans selection:bg-sky-200">
      {/* Navigation Sidebar */}
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <TopBar />
        
        {renderContent()}
      </main>

      {/* Mobile Padding (for bottom nav) */}
      <div className="h-16 lg:hidden" />
    </div>
  );
}
