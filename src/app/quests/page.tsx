'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuests } from '@/components/providers/GameProvider';
import { QuestCard } from '@/components/dashboard/QuestCard';
import { Button } from '@/components/ui/Button';
import { type QuestType, type QuestCategory } from '@/lib/types';

type TypeFilter = 'all' | QuestType | 'completed';
type CategoryFilter = 'all' | QuestCategory;

export default function QuestsPage() {
  const { quests, deleteQuest } = useQuests();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const typeFilters: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'main', label: 'Main' },
    { value: 'daily', label: 'Daily' },
    { value: 'side', label: 'Side' },
    { value: 'completed', label: 'Done' },
  ];

  const categoryFilters: { value: CategoryFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'mind', label: '📘 Mind' },
    { value: 'body', label: '💪 Body' },
    { value: 'hearth', label: '🏠 Hearth' },
  ];

  const filtered = quests.filter(q => {
    if (typeFilter === 'completed') {
      if (q.status !== 'completed') return false;
    } else if (typeFilter === 'all') {
      if (q.status === 'completed') return false;
    } else {
      if (q.type !== typeFilter || q.status === 'completed') return false;
    }
    if (categoryFilter !== 'all' && q.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl uppercase tracking-wider">
          <span className="text-primary">📜</span> Quest Log
        </h1>
        <Link href="/quests/new">
          <Button size="md">+ New Quest</Button>
        </Link>
      </div>

      <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
        {typeFilters.map(f => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={`
              px-3 py-1.5 font-mono text-xs uppercase tracking-wider cursor-pointer
              border-2 transition-colors whitespace-nowrap
              ${typeFilter === f.value
                ? 'bg-primary text-on-primary border-primary-container'
                : 'bg-surface-container text-on-surface-variant border-outline-variant hover:bg-surface-high'
              }
            `}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {categoryFilters.map(f => (
          <button
            key={f.value}
            onClick={() => setCategoryFilter(f.value)}
            className={`
              px-3 py-1.5 font-mono text-xs uppercase tracking-wider cursor-pointer
              border-2 transition-colors whitespace-nowrap
              ${categoryFilter === f.value
                ? 'bg-tertiary text-on-tertiary border-tertiary-container'
                : 'bg-surface-container text-on-surface-variant border-outline-variant hover:bg-surface-high'
              }
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="border-2 border-outline-variant border-dashed bg-surface-container p-8 text-center">
          <p className="font-display text-sm text-outline mb-2">
            {typeFilter === 'completed' ? 'No completed quests yet.' : 'No quests found.'}
          </p>
          {typeFilter !== 'completed' && (
            <p className="font-body text-xs text-outline">
              Create a quest to start your adventure!
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(quest => (
            <div key={quest.id} className="group relative">
              <QuestCard quest={quest} />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/quests/new?id=${quest.id}`}
                  className="text-on-surface-variant text-xs font-mono px-1.5 py-0.5
                    bg-surface-high border border-outline-variant cursor-pointer
                    hover:bg-surface-highest"
                  title="Edit quest"
                >
                  ✎
                </Link>
                <button
                  onClick={() => deleteQuest(quest.id)}
                  className="text-error text-xs font-mono px-1.5 py-0.5
                    bg-surface-high border border-outline-variant cursor-pointer
                    hover:bg-error-container"
                  title="Delete quest"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
