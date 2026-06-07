'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type Quest, type QuestType, type QuestCategory, type StatName } from '@/lib/types';
import { useQuests, useGameState } from '@/components/providers/GameProvider';
import { QUEST_TYPE_CONFIG, STAT_LABELS } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';

async function generateQuestText(task: string) {
  const res = await fetch('/api/generate-quest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task }),
  });
  if (!res.ok) throw new Error('Generation failed');
  return res.json() as Promise<{ title: string; description: string; flavorText: string }>;
}

interface QuestFormProps {
  existingQuest?: Quest;
}

export function QuestForm({ existingQuest }: QuestFormProps) {
  const router = useRouter();
  const { addQuest, editQuest } = useQuests();
  const isEditing = !!existingQuest;

  const [title, setTitle] = useState(existingQuest?.title ?? '');
  const [description, setDescription] = useState(existingQuest?.description ?? '');
  const [flavorText, setFlavorText] = useState(existingQuest?.flavorText ?? '');
  const [questType, setQuestType] = useState<QuestType>(existingQuest?.type ?? 'daily');
  const [xp, setXp] = useState(existingQuest?.reward.xp ?? QUEST_TYPE_CONFIG.daily.defaultXp);
  const [gold, setGold] = useState(existingQuest?.reward.gold ?? QUEST_TYPE_CONFIG.daily.defaultGold);
  const [recurring, setRecurring] = useState(existingQuest?.recurring ?? false);
  const [repeatable, setRepeatable] = useState(existingQuest?.repeatable ?? false);
  const [timerMinutes, setTimerMinutes] = useState(existingQuest?.timerMinutes ?? 0);
  const [category, setCategory] = useState<QuestCategory | ''>(existingQuest?.category ?? '');
  const [statBonus, setStatBonus] = useState<StatName | ''>('');
  const [statValue, setStatValue] = useState(0);
  const [isGlobal, setIsGlobal] = useState(existingQuest?.isGlobal ?? true);
  const [taskInput, setTaskInput] = useState('');
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    if (!taskInput.trim()) return;
    setGenerating(true);
    try {
      const result = await generateQuestText(taskInput.trim());
      setTitle(result.title);
      setDescription(result.description);
      setFlavorText(result.flavorText);
    } catch {
      // silently fail — user can fill in manually
    } finally {
      setGenerating(false);
    }
  }

  function handleTypeChange(type: QuestType) {
    setQuestType(type);
    if (!isEditing) {
      setXp(QUEST_TYPE_CONFIG[type].defaultXp);
      setGold(QUEST_TYPE_CONFIG[type].defaultGold);
      setRecurring(type === 'daily');
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const reward = {
      xp,
      gold,
      stats: statBonus && statValue > 0 ? { [statBonus]: statValue } : undefined,
    };

    if (isEditing && existingQuest) {
      editQuest({
        ...existingQuest,
        title: title.trim(),
        description: description.trim(),
        flavorText: flavorText.trim() || undefined,
        type: questType,
        category: category || undefined,
        reward,
        recurring,
        repeatable,
        timerMinutes: timerMinutes || undefined,
        isGlobal,
      });
    } else {
      addQuest({
        title: title.trim(),
        description: description.trim(),
        flavorText: flavorText.trim() || undefined,
        type: questType,
        category: category || undefined,
        reward,
        recurring,
        repeatable,
        timerMinutes: timerMinutes || undefined,
        isGlobal,
      });
    }

    router.push('/quests');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {!isEditing && (
        <div className="border-2 border-primary/30 bg-primary/5 p-4 space-y-2">
          <label className="font-display text-xs uppercase tracking-wider text-primary block">
            AI Quest Generator
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Describe your task briefly... (e.g. do laundry)"
              value={taskInput}
              onChange={e => setTaskInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleGenerate(); } }}
              className="flex-1 px-3 py-2 bg-surface-lowest border-2 border-outline-variant
                font-body text-sm text-on-surface placeholder:text-outline
                focus:outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || !taskInput.trim()}
              className="px-4 py-2 bg-primary text-on-primary font-display text-xs
                uppercase tracking-wider border-2 border-primary-container
                disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
                hover:brightness-110 transition-all"
            >
              {generating ? '...' : 'Generate'}
            </button>
          </div>
          <p className="font-mono text-[10px] text-outline">
            Generates title, description &amp; flavor text from a short task description
          </p>
        </div>
      )}

      <Input
        label="Quest Title"
        placeholder="Enter quest name..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />

      <Textarea
        label="Description"
        placeholder="What needs to be done?"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />

      <Textarea
        label="Flavor Text (optional)"
        placeholder="A wise sage once said..."
        value={flavorText}
        onChange={e => setFlavorText(e.target.value)}
      />

      <Select
        label="Quest Type"
        value={questType}
        onChange={e => handleTypeChange(e.target.value as QuestType)}
        options={[
          { value: 'main', label: 'Main Quest' },
          { value: 'daily', label: 'Daily Grind' },
          { value: 'side', label: 'Side Quest' },
        ]}
      />

      <Select
        label="Skill Branch"
        value={category}
        onChange={e => setCategory(e.target.value as QuestCategory | '')}
        options={[
          { value: '', label: 'None' },
          { value: 'mind', label: '📘 Mind — Learning, coding, reading' },
          { value: 'body', label: '💪 Body — Exercise, cleaning, health' },
          { value: 'hearth', label: '🏠 Hearth — Cleaning, chores, organizing' },
        ]}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="XP Reward"
          type="number"
          min={0}
          value={xp}
          onChange={e => setXp(Number(e.target.value))}
        />
        <Input
          label="Gold Reward"
          type="number"
          min={0}
          value={gold}
          onChange={e => setGold(Number(e.target.value))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Stat Bonus"
          value={statBonus}
          onChange={e => setStatBonus(e.target.value as StatName | '')}
          options={[
            { value: '', label: 'None' },
            ...Object.entries(STAT_LABELS).map(([key, label]) => ({
              value: key,
              label: `+${label}`,
            })),
          ]}
        />
        {statBonus && (
          <Input
            label="Stat Amount"
            type="number"
            min={1}
            max={10}
            value={statValue}
            onChange={e => setStatValue(Number(e.target.value))}
          />
        )}
      </div>

      {questType === 'daily' && (
        <Input
          label="Timer (minutes, optional)"
          type="number"
          min={0}
          value={timerMinutes}
          onChange={e => setTimerMinutes(Number(e.target.value))}
          placeholder="0"
        />
      )}

      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={recurring}
            onChange={e => { setRecurring(e.target.checked); if (e.target.checked) setRepeatable(false); }}
            className="w-5 h-5 accent-primary bg-surface-lowest"
          />
          <span className="font-mono text-xs uppercase text-on-surface-variant">
            Daily (resets each morning)
          </span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={repeatable}
            onChange={e => { setRepeatable(e.target.checked); if (e.target.checked) setRecurring(false); }}
            className="w-5 h-5 accent-primary bg-surface-lowest"
          />
          <span className="font-mono text-xs uppercase text-on-surface-variant">
            Repeatable (available again after completing)
          </span>
        </label>
      </div>

      <div className="border-2 border-outline-variant bg-surface-container p-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isGlobal}
            onChange={e => setIsGlobal(e.target.checked)}
            className="w-5 h-5 accent-primary bg-surface-lowest"
          />
          <div>
            <span className="font-mono text-xs uppercase text-on-surface-variant block">
              Shared Quest
            </span>
            <span className="font-mono text-[10px] text-outline">
              {isGlobal ? 'Visible to all adventurers' : 'Only visible to you'}
            </span>
          </div>
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" variant="primary">
          {isEditing ? 'Save Quest' : 'Create Quest'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
