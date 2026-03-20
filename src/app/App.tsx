import React, { useEffect, useState } from 'react';

import { fetchLevels, fetchProfile } from './api';
import { Leaderboard } from './components/Leaderboard';
import { LessonGame } from './components/LessonGame';
import { LessonPath } from './components/LessonPath';
import { ContentPage } from './components/ContentPage';
import { ProfilePage } from './components/ProfilePage';
import { RightPanel } from './components/RightPanel';
import { SettingsPage } from './components/SettingsPage';
import { Sidebar } from './components/Sidebar';
import { SignIn } from './components/SignIn';
import { TopBar } from './components/TopBar';
import type { Level, UserProfile } from './types';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [currentPage, setCurrentPage] = useState('learn');
  const [activeLesson, setActiveLesson] = useState<Level | null>(null);

  useEffect(() => {
    fetchLevels().then((response) => setLevels(response.levels)).catch(() => setLevels([]));
  }, []);

  const refreshUser = async (userId: number) => {
    const response = await fetchProfile(userId);
    setUser(response.user);
  };

  if (!user) {
    return <SignIn onSignedIn={setUser} />;
  }

  if (activeLesson) {
    return (
      <LessonGame
        level={activeLesson}
        user={user}
        onExit={() => {
          setActiveLesson(null);
          refreshUser(user.id).catch(() => undefined);
        }}
        onLessonComplete={(updatedUser) => {
          setUser(updatedUser);
        }}
      />
    );
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'leaderboard':
        return <Leaderboard user={user} />;
      case 'content':
        return <ContentPage />;
      case 'profile':
        return <ProfilePage user={user} onUserChange={setUser} />;
      case 'settings':
        return <SettingsPage user={user} onUserChange={setUser} />;
      case 'learn':
      default:
        return (
          <div className="flex h-full">
            <div className="flex min-w-0 flex-1">
              <LessonPath levels={levels} user={user} onStartLesson={setActiveLesson} />
            </div>
            <RightPanel user={user} onViewLeaderboard={() => setCurrentPage('leaderboard')} />
          </div>
        );
    }
  };

  return (
    <div className={`flex h-screen bg-white font-sans ${user.settings.highContrast ? 'contrast-125 saturate-125' : ''}`}>
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onSignOut={() => {
          setUser(null);
          setCurrentPage('learn');
        }}
      />

      <main className="relative flex min-w-0 flex-1 flex-col">
        <TopBar user={user} />
        {renderContent()}
      </main>

      <div className="h-16 lg:hidden" />
    </div>
  );
}
