'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useHero } from '@/components/providers/GameProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { ProgressBar } from '@/components/ui/ProgressBar';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '⚔' },
  { href: '/quests', label: 'Quests', icon: '📜' },
  { href: '/skills', label: 'Skills', icon: '🌳' },
  { href: '/achievements', label: 'Trophies', icon: '🏆' },
  { href: '/character', label: 'Character', icon: '👤' },
  { href: '/inventory', label: 'Inventory', icon: '🎒' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hero, xpPercent, xpIntoCurrentLevel, xpForCurrentLevel } = useHero();
  const { logout } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-60 border-r-2 border-outline-variant bg-surface-low min-h-dvh">
      <div className="p-4 border-b-2 border-outline-variant">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bevel bg-surface-high flex items-center justify-center text-2xl">
            ⚔
          </div>
          <div className="min-w-0">
            <p className="font-display text-primary text-xs truncate">Level {hero.level} {hero.name}</p>
            <p className="font-mono text-[10px] text-on-surface-variant">
              XP: {xpIntoCurrentLevel} / {xpForCurrentLevel}
            </p>
          </div>
        </div>
        <ProgressBar
          value={xpPercent}
          color="xp"
          segments={15}
          size="sm"
          className="mt-2"
        />
      </div>

      <nav className="flex-1 py-2">
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 font-display text-xs uppercase tracking-wider
                transition-colors
                ${isActive
                  ? 'bg-primary/15 text-primary border-l-4 border-primary'
                  : 'text-on-surface-variant hover:bg-surface-high hover:text-on-surface border-l-4 border-transparent'
                }
              `}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 space-y-2">
        <Link
          href="/quests/new"
          className="block w-full px-4 py-3 bg-primary text-on-primary font-display text-xs
            uppercase tracking-wider text-center border-2 border-primary-container
            border-b-4 border-r-4 shadow-md
            active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
            transition-transform duration-75 hover:brightness-110"
        >
          + New Quest
        </Link>
        <button
          onClick={() => logout()}
          className="block w-full px-4 py-2 font-mono text-[10px] uppercase tracking-wider
            text-center text-outline hover:text-on-surface-variant cursor-pointer
            border-2 border-outline-variant hover:bg-surface-high transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
