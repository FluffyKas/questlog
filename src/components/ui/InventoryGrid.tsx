'use client';

import { useGameState } from '@/components/providers/GameProvider';

interface InventoryGridProps {
  slots?: number;
  columns?: number;
  compact?: boolean;
}

export function InventoryGrid({ slots = 9, columns = 3, compact = false }: InventoryGridProps) {
  const { state } = useGameState();
  const items = state.inventory;
  const size = compact ? 'w-10 h-10' : 'w-14 h-14';

  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {Array.from({ length: slots }).map((_, i) => {
        const item = items[i];
        return (
          <div
            key={i}
            className={`${size} bevel-inset bg-surface-lowest flex items-center justify-center text-lg`}
            title={item?.name}
          >
            {item ? (
              <span>{item.icon}</span>
            ) : (
              <span className="text-outline-variant/30">.</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
