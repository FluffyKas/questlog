'use client';

import { useActivityLog } from '@/components/providers/GameProvider';

export function ActivityLog({ maxEntries = 10 }: { maxEntries?: number }) {
  const { log } = useActivityLog();
  const entries = log.slice(0, maxEntries);

  return (
    <div className="border-2 border-outline-variant bg-surface-lowest p-3 font-mono text-xs overflow-y-auto max-h-48">
      {entries.length === 0 ? (
        <p className="text-outline">No activity yet...</p>
      ) : (
        entries.map(entry => {
          const time = new Date(entry.timestamp);
          const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return (
            <div key={entry.id} className="text-primary mb-1 leading-relaxed">
              <span className="text-outline">&gt; {timeStr}:</span>{' '}
              {entry.message}
            </div>
          );
        })
      )}
    </div>
  );
}
