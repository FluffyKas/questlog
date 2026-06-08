'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { AchievementToast } from '@/components/ui/AchievementToast';

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-dvh">
        <Header />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
        <Link
          href="/quests/new"
          className="md:hidden fixed right-4 bottom-[72px] z-50 w-12 h-12
            flex items-center justify-center
            bg-primary text-on-primary font-display text-2xl
            border-2 border-primary-container border-b-4 border-r-4
            shadow-md active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
            transition-transform duration-75"
        >
          +
        </Link>
        <BottomNav />
      </div>
      <AchievementToast />
    </div>
  );
}
