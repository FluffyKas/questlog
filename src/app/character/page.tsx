'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useHero, useGameState, useAchievements } from '@/components/providers/GameProvider';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { InventoryGrid } from '@/components/ui/InventoryGrid';
import { STAT_LABELS } from '@/lib/constants';
import { type StatName } from '@/lib/types';

type Tab = 'character' | 'inventory';

const tabs: { key: Tab; label: string; icon: string | null }[] = [
  { key: 'character', label: 'Character', icon: '⚔' },
  { key: 'inventory', label: 'Inventory', icon: null },
];

export default function CharacterPage() {
  const [activeTab, setActiveTab] = useState<Tab>('character');
  const { hero, xpIntoCurrentLevel, xpForCurrentLevel } = useHero();
  const { state } = useGameState();
  const { unlockedTitles, setTitle } = useAchievements();

  const totalCompleted = state.quests.filter(q => q.status === 'completed').length;

  const statColors: Record<StatName, string> = {
    str: 'text-error',
    int: 'text-info',
    wis: 'text-mana',
    dex: 'text-gold',
    cha: 'text-hp',
    con: 'text-xp',
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      <h1 className="font-display text-xl uppercase tracking-wider mb-6">
        <span className="text-primary">⚔</span> Hero
      </h1>

      {/* Tabs */}
      <div className="flex border-2 border-outline-variant bg-surface-low mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              flex-1 flex items-center justify-center gap-1.5 py-3
              font-display text-xs uppercase tracking-wider cursor-pointer
              transition-colors border-b-2
              ${activeTab === tab.key
                ? 'bg-primary/15 text-primary border-primary'
                : 'text-on-surface-variant border-transparent hover:bg-surface-high'
              }
            `}
          >
            {tab.icon ? (
              <span className="text-sm">{tab.icon}</span>
            ) : (
              <Image
                src="/icons/inventory_chest.png"
                alt=""
                width={16}
                height={16}
                className="[image-rendering:pixelated]"
              />
            )}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Character Tab */}
      {activeTab === 'character' && (
        <>
          {/* Hero Card */}
          <div className="border-2 border-outline-variant bg-surface-container shadow-md p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-24 h-24 bevel bg-surface-high flex items-center justify-center text-5xl">
                ⚔
              </div>
              <div>
                <h2 className="font-display text-lg text-primary">{hero.name}</h2>
                <p className="font-mono text-sm text-on-surface-variant">Level {hero.level}</p>
                {hero.title && (
                  <p className="font-mono text-xs text-gold italic">{hero.title}</p>
                )}
                {unlockedTitles.length > 0 && (
                  <select
                    value={hero.title || ''}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-2 bg-surface-high border-2 border-outline-variant px-2 py-1 font-mono text-xs text-on-surface-variant cursor-pointer"
                  >
                    <option value="">No title</option>
                    {unlockedTitles.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <ProgressBar
              label="Health Points (HP)"
              value={hero.hp}
              max={hero.maxHp}
              color="hp"
              showValue
              size="md"
              className="mb-4"
            />
            <ProgressBar
              label="Experience (XP)"
              value={xpIntoCurrentLevel}
              max={xpForCurrentLevel}
              color="xp"
              showValue
              size="md"
            />
          </div>

          {/* Stats */}
          <div className="border-2 border-outline-variant bg-surface-container shadow-md p-6 mb-6">
            <h3 className="font-display text-sm uppercase tracking-wider text-on-surface-variant mb-4">
              Attributes
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(Object.entries(hero.stats) as [StatName, number][]).map(([stat, value]) => (
                <div key={stat} className="bevel bg-surface-high p-3 text-center">
                  <p className="font-mono text-[10px] uppercase text-on-surface-variant mb-1">
                    {STAT_LABELS[stat]}
                  </p>
                  <p className={`font-display text-2xl ${statColors[stat]}`}>
                    {value}
                  </p>
                  <p className="font-mono text-[10px] uppercase text-outline mt-1">
                    {stat.toUpperCase()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="border-2 border-outline-variant bg-surface-container shadow-md p-6">
            <h3 className="font-display text-sm uppercase tracking-wider text-on-surface-variant mb-4">
              Adventure Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="font-display text-2xl text-primary">{totalCompleted}</p>
                <p className="font-mono text-[10px] uppercase text-on-surface-variant">Quests Completed</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl text-gold">{hero.gold.toLocaleString()}</p>
                <p className="font-mono text-[10px] uppercase text-on-surface-variant">Gold Earned</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl text-xp">{hero.xp.toLocaleString()}</p>
                <p className="font-mono text-[10px] uppercase text-on-surface-variant">Total XP</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl text-mana">{state.streak.longest}</p>
                <p className="font-mono text-[10px] uppercase text-on-surface-variant">Best Streak</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <>
          {/* Currency */}
          <div className="border-2 border-outline-variant bg-surface-container shadow-md p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm uppercase text-on-surface-variant">Currency</span>
              <span className="font-display text-xl text-gold">
                ⊛ {hero.gold.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Inventory Grid */}
          <div className="border-2 border-outline-variant bg-surface-container shadow-md p-6">
            <h3 className="font-display text-sm uppercase tracking-wider text-on-surface-variant mb-4">
              Items
            </h3>
            <InventoryGrid slots={24} columns={6} />
            <p className="font-body text-xs text-outline mt-4 text-center">
              Complete quests to earn items. Shop coming soon!
            </p>
          </div>
        </>
      )}
    </div>
  );
}
