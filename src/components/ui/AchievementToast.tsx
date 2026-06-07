'use client';

import { useEffect, useRef, useState } from 'react';
import { useAchievements } from '@/components/providers/GameProvider';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { type AchievementRarity } from '@/lib/types';

const rarityBorder: Record<AchievementRarity, string> = {
  common: 'border-outline-variant',
  uncommon: 'border-primary',
  rare: 'border-info',
  epic: 'border-mana',
  legendary: 'border-gold',
};

const rarityGlow: Record<AchievementRarity, string> = {
  common: '',
  uncommon: 'shadow-[0_0_12px_var(--color-primary)]',
  rare: 'shadow-[0_0_12px_var(--color-info)]',
  epic: 'shadow-[0_0_16px_var(--color-mana)]',
  legendary: 'shadow-[0_0_20px_var(--color-gold)]',
};

interface ToastItem {
  id: string;
  name: string;
  icon: string;
  rarity: AchievementRarity;
  reward: { gold?: number; title?: string };
}

export function AchievementToast() {
  const { achievements } = useAchievements();
  const prevCountRef = useRef(achievements.unlockedIds.length);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const prevCount = prevCountRef.current;
    const currentCount = achievements.unlockedIds.length;

    if (currentCount > prevCount) {
      const newIds = achievements.unlockedIds.slice(prevCount);
      const newToasts: ToastItem[] = newIds
        .map(id => ACHIEVEMENTS.find(a => a.id === id))
        .filter(Boolean)
        .map(def => ({
          id: def!.id,
          name: def!.name,
          icon: def!.icon,
          rarity: def!.rarity,
          reward: def!.reward,
        }));

      setToasts(prev => [...prev, ...newToasts]);
    }

    prevCountRef.current = currentCount;
  }, [achievements.unlockedIds]);

  useEffect(() => {
    if (toasts.length === 0) return;

    const timer = setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, 6000);

    return () => clearTimeout(timer);
  }, [toasts]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.slice(0, 3).map((toast, i) => (
        <div
          key={`${toast.id}-${i}`}
          className={`
            pointer-events-auto
            border-2 bg-surface-container p-5 min-w-[320px] max-w-[380px]
            ${rarityBorder[toast.rarity]} ${rarityGlow[toast.rarity]}
            animate-[slide-in_0.3s_ease-out]
          `}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center text-3xl bevel bg-surface-high flex-shrink-0">
              {toast.icon}
            </div>
            <div className="min-w-0">
              <p className="font-mono text-xs uppercase text-gold tracking-wider">
                Achievement Unlocked!
              </p>
              <p className="font-display text-base text-on-surface truncate mt-0.5">
                {toast.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {toast.reward.gold && (
                  <span className="font-mono text-xs text-gold">+{toast.reward.gold}g</span>
                )}
                {toast.reward.title && (
                  <span className="font-mono text-xs text-mana">&quot;{toast.reward.title}&quot;</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
