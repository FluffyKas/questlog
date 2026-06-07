'use client';

import Link from 'next/link';
import { useQuests } from '@/components/providers/GameProvider';
import { QuestCard } from './QuestCard';
import { Button } from '@/components/ui/Button';

export function ActiveQuests() {
  const { quests } = useQuests();
  const active = quests.filter(q => q.status === 'in_progress');
  const recurring = quests.filter(q =>
    q.status === 'not_started' && q.repeatIntervalDays
  );

  return (
    <div>
      <h2 className="font-display text-lg uppercase tracking-wider text-on-surface mb-4 flex items-center gap-2">
        <span className="text-primary">⚔</span> Active Quests
      </h2>

      {active.length === 0 ? (
        <div className="border-2 border-outline-variant border-dashed bg-surface-container p-8 text-center">
          <p className="font-display text-sm text-outline mb-3">No active quests.</p>
          <p className="font-body text-xs text-outline mb-4">Pick a quest from your log to begin!</p>
          <Link href="/quests">
            <Button size="md">Start Quest</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {active.map(quest => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      )}

      {recurring.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-lg uppercase tracking-wider text-on-surface mb-4 flex items-center gap-2">
            <span className="text-primary">🔁</span> Recurring Quests
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recurring.map(quest => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
