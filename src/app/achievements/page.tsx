'use client';

import { ACHIEVEMENTS, getProgress } from '@/lib/achievements';
import { useAchievements } from '@/components/providers/GameProvider';
import { type AchievementRarity } from '@/lib/types';
import { ProgressBar } from '@/components/ui/ProgressBar';

const rarityBorder: Record<AchievementRarity, string> = {
  common: 'border-outline-variant',
  uncommon: 'border-primary',
  rare: 'border-info',
  epic: 'border-mana',
  legendary: 'border-gold',
};

const rarityGlow: Record<AchievementRarity, string> = {
  common: '',
  uncommon: 'shadow-[0_0_8px_var(--color-primary)]',
  rare: 'shadow-[0_0_8px_var(--color-info)]',
  epic: 'shadow-[0_0_12px_var(--color-mana)]',
  legendary: 'shadow-[0_0_16px_var(--color-gold)]',
};

const rarityLabel: Record<AchievementRarity, string> = {
  common: 'text-outline',
  uncommon: 'text-primary',
  rare: 'text-info',
  epic: 'text-mana',
  legendary: 'text-gold',
};

const rarityProgressColor: Record<AchievementRarity, 'primary' | 'xp' | 'info' | 'mana' | 'gold'> = {
  common: 'primary',
  uncommon: 'primary',
  rare: 'info',
  epic: 'mana',
  legendary: 'gold',
};

export default function AchievementsPage() {
  const { achievements, hero, streak, skillTree } = useAchievements();
  const unlockedCount = achievements.unlockedIds.length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-primary text-lg uppercase tracking-wider">
          Hall of Heroes
        </h1>
        <p className="font-mono text-xs text-on-surface-variant mt-1">
          {unlockedCount} / {totalCount} achievements unlocked
        </p>
        <ProgressBar
          value={unlockedCount}
          max={totalCount}
          segments={totalCount}
          color="gold"
          size="sm"
          className="mt-2 max-w-xs"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACHIEVEMENTS.map(def => {
          const isUnlocked = achievements.unlockedIds.includes(def.id);
          const progress = getProgress(def, achievements.stats, hero.level, streak.current, skillTree);
          const unlockedDate = achievements.unlockedAt[def.id];

          return (
            <div
              key={def.id}
              className={`
                border-2 bg-surface-container p-4 transition-all
                ${isUnlocked ? rarityBorder[def.rarity] : 'border-outline-variant opacity-60'}
                ${isUnlocked ? rarityGlow[def.rarity] : ''}
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  w-10 h-10 flex items-center justify-center text-2xl bevel bg-surface-high flex-shrink-0
                  ${!isUnlocked ? 'grayscale' : ''}
                `}>
                  {isUnlocked ? def.icon : '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-display text-xs uppercase tracking-wider truncate ${isUnlocked ? 'text-on-surface' : 'text-outline'}`}>
                      {def.name}
                    </h3>
                    <span className={`font-mono text-[10px] uppercase ${rarityLabel[def.rarity]}`}>
                      {def.rarity}
                    </span>
                  </div>
                  <p className="font-body text-xs text-on-surface-variant mt-0.5">
                    {def.description}
                  </p>
                </div>
              </div>

              {!isUnlocked && (
                <ProgressBar
                  value={Math.min(progress.current, progress.target)}
                  max={progress.target}
                  segments={10}
                  color={rarityProgressColor[def.rarity]}
                  size="sm"
                  className="mt-3"
                />
              )}

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {def.reward.gold && (
                    <span className="font-mono text-[10px] text-gold">
                      +{def.reward.gold}g
                    </span>
                  )}
                  {def.reward.title && (
                    <span className="font-mono text-[10px] text-mana">
                      &quot;{def.reward.title}&quot;
                    </span>
                  )}
                </div>
                {isUnlocked ? (
                  <span className="font-mono text-[10px] text-primary">
                    {new Date(unlockedDate).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="font-mono text-[10px] text-outline">
                    {progress.current}/{progress.target}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
