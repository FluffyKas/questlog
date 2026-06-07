'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home', icon: '⚔' },
  { href: '/quests', label: 'Quests', icon: '📜' },
  { href: '/skills', label: 'Skills', icon: '🌳' },
  { href: '/achievements', label: 'Trophies', icon: '🏆' },
  { href: '/character', label: 'Hero', icon: '👤' },
  { href: '/inventory', label: 'Items', icon: '🎒' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t-2 border-outline-variant bg-surface-low">
      <div className="flex items-stretch">
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex-1 flex flex-col items-center justify-center py-2 gap-0.5
                transition-colors min-h-[56px]
                ${isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-outline hover:text-on-surface-variant'
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-mono text-[10px] uppercase">{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)] bg-surface-low" />
    </nav>
  );
}
