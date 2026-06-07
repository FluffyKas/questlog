'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { GameProvider } from '@/components/providers/GameProvider';
import { Shell } from './Shell';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-surface">
        <p className="font-display text-primary text-lg animate-pulse">Loading QuestLog...</p>
      </div>
    );
  }

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  return (
    <GameProvider userId={user.id}>
      <Shell>{children}</Shell>
    </GameProvider>
  );
}
