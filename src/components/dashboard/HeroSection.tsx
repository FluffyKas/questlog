'use client';

import { useHero } from '@/components/providers/GameProvider';
import { ProgressBar } from '@/components/ui/ProgressBar';

export function HeroSection() {
  const { hero, xpPercent, xpIntoCurrentLevel, xpForCurrentLevel, hpPercent } = useHero();

  return (
    <div className="border-2 border-outline-variant bg-surface-container p-4 shadow-md">
      <div className="flex gap-4 items-start">
        <div className="w-20 h-20 md:w-24 md:h-24 bevel bg-surface-high flex-shrink-0 flex items-center justify-center">
          <span className="text-4xl md:text-5xl">⚔</span>
        </div>
        <div className="flex-1 min-w-0">
          <ProgressBar
            label="Health Points (HP)"
            value={hero.hp}
            max={hero.maxHp}
            color="hp"
            showValue
            segments={20}
            size="md"
          />
          <ProgressBar
            label="Experience (XP)"
            value={xpIntoCurrentLevel}
            max={xpForCurrentLevel}
            color="xp"
            showValue
            segments={20}
            size="md"
            className="mt-3"
          />
        </div>
      </div>
    </div>
  );
}
