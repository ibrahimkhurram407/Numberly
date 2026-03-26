import React, { useEffect, useState } from 'react';

import { fetchLevels, fetchProfile } from './api';
import { Leaderboard } from './components/Leaderboard';
import { LessonGame } from './components/LessonGame';
import { LessonPath } from './components/LessonPath';
import { ContentPage } from './components/ContentPage';
import { AdminPage } from './components/AdminPage';
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
    const stored = window.localStorage.getItem('numberly_user');
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as UserProfile;
      setUser(parsed);
      fetchProfile(parsed.id).then((response) => setUser(response.user)).catch(() => undefined);
    } catch {
      window.localStorage.removeItem('numberly_user');
    }
  }, []);

  useEffect(() => {
    fetchLevels().then((response) => setLevels(response.levels)).catch(() => setLevels([]));
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin' && (currentPage === 'content' || currentPage === 'admin')) {
      setCurrentPage('learn');
    }
  }, [currentPage, user?.role]);

  const refreshUser = async (userId: number) => {
    const response = await fetchProfile(userId);
    setUser(response.user);
  };

  useEffect(() => {
    if (user) {
      window.localStorage.setItem('numberly_user', JSON.stringify(user));
    } else {
      window.localStorage.removeItem('numberly_user');
    }
  }, [user]);

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
        return <ContentPage user={user} />;
      case 'admin':
        return <AdminPage user={user} />;
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
        isAdmin={user.role === 'admin'}
        onSignOut={() => {
          setUser(null);
          window.localStorage.removeItem('numberly_user');
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
