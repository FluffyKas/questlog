'use client';

import Image from 'next/image';
import { useHero } from '@/components/providers/GameProvider';
import { InventoryGrid } from '@/components/ui/InventoryGrid';

export default function InventoryPage() {
  const { hero } = useHero();

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      <h1 className="font-display text-xl uppercase tracking-wider mb-6 flex items-center gap-2">
        <Image
          src="/icons/inventory_chest.png"
          alt=""
          width={28}
          height={28}
          className="[image-rendering:pixelated]"
        />
        Inventory
      </h1>

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
    </div>
  );
}
