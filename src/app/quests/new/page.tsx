'use client';

import { useSearchParams } from 'next/navigation';
import { useQuests } from '@/components/providers/GameProvider';
import { QuestForm } from '@/components/quest/QuestForm';
import { Suspense } from 'react';

function QuestFormWrapper() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { quests } = useQuests();
  const existingQuest = editId ? quests.find(q => q.id === editId) : undefined;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="font-display text-xl uppercase tracking-wider mb-6">
        <span className="text-primary">⚔</span>{' '}
        {existingQuest ? 'Edit Quest' : 'New Quest'}
      </h1>
      <QuestForm existingQuest={existingQuest} />
    </div>
  );
}

export default function NewQuestPage() {
  return (
    <Suspense fallback={
      <div className="p-4 md:p-6 lg:p-8">
        <p className="font-display text-primary animate-pulse">Loading...</p>
      </div>
    }>
      <QuestFormWrapper />
    </Suspense>
  );
}
