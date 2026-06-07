'use client';

import { useGameState, useHero } from '@/components/providers/GameProvider';
import { ActivityLog } from '@/components/ui/ActivityLog';
import { InventoryGrid } from '@/components/ui/InventoryGrid';

export function SidePanel() {
  const { state } = useGameState();
  const { hero } = useHero();

  return (
    <div className="space-y-4">
      {/* Quest Streak */}
      <div className="border-2 border-outline-variant bg-surface-container p-4 shadow-md">
        <h3 className="font-display text-xs uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
          🔥 Quest Streak
        </h3>
        <div className="text-center">
          <p className="font-display text-4xl text-on-surface">
            {String(state.streak.current).padStart(2, '0')}
          </p>
          <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">
            Consecutive Days
          </p>
        </div>
      </div>

      {/* Inventory Preview */}
      <div className="border-2 border-outline-variant bg-surface-container p-4 shadow-md">
        <h3 className="font-display text-xs uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
          🎒 Inventory
        </h3>
        <InventoryGrid slots={6} columns={3} compact />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-outline-variant">
          <span className="font-mono text-xs text-on-surface-variant uppercase">Currency</span>
          <span className="font-mono text-sm text-gold font-bold">
            ⊛ {hero.gold.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Activity Log */}
      <div className="border-2 border-outline-variant bg-surface-container p-4 shadow-md">
        <h3 className="font-display text-xs uppercase tracking-wider text-on-surface-variant mb-3">
          &gt; Activity Log
        </h3>
        <ActivityLog maxEntries={8} />
      </div>
    </div>
  );
}
