'use client';

import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b-2 border-outline-variant bg-surface-low">
      <Link href="/" className="font-display text-lg font-bold text-primary uppercase tracking-wider">
        QuestLog
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/character" className="text-outline hover:text-on-surface text-xl">
          👤
        </Link>
      </div>
    </header>
  );
}
