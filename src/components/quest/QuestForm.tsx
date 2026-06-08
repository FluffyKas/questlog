'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type Quest, type QuestType, type QuestCategory, type StatName, type EpicQuestRequirement } from '@/lib/types';
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
  const [questType, setQuestType] = useState<QuestType>(existingQuest?.type ?? 'normal');
  const [xp, setXp] = useState(existingQuest?.reward.xp ?? QUEST_TYPE_CONFIG.normal.defaultXp);
  const [gold, setGold] = useState(existingQuest?.reward.gold ?? QUEST_TYPE_CONFIG.normal.defaultGold);
  const [recurring, setRecurring] = useState(existingQuest?.recurring ?? false);
  const [repeatable, setRepeatable] = useState(existingQuest?.repeatable ?? false);
  const [repeatIntervalDays, setRepeatIntervalDays] = useState(existingQuest?.repeatIntervalDays ?? 0);
  const [repeatTimeLimitDays, setRepeatTimeLimitDays] = useState(existingQuest?.repeatTimeLimitDays ?? 0);
  const [timerDays, setTimerDays] = useState(existingQuest?.timerDays ?? 0);
  const [category, setCategory] = useState<QuestCategory | ''>(existingQuest?.category ?? '');
  const [statBonus, setStatBonus] = useState<StatName | ''>('');
  const [statValue, setStatValue] = useState(0);
  const [isGlobal, setIsGlobal] = useState(existingQuest?.isGlobal ?? true);
  const [requirements, setRequirements] = useState<EpicQuestRequirement[]>(
    existingQuest?.requirements ?? []
  );
  const [taskInput, setTaskInput] = useState('');
  const [generating, setGenerating] = useState(false);

  const { state } = useGameState();
  const availableQuests = state.quests.filter(q => q.type !== 'epic' && q.id !== existingQuest?.id);

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
      setRecurring(false);
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

    const validRequirements = questType === 'epic'
      ? requirements.filter(r => r.questId && r.count > 0)
      : undefined;

    if (isEditing && existingQuest) {
      editQuest({
        ...existingQuest,
        title: title.trim(),
        description: description.trim(),
        flavorText: flavorText.trim() || undefined,
        type: questType,
        category: category || undefined,
        reward,
        recurring: validRequirements?.length ? false : recurring,
        repeatable: validRequirements?.length ? false : repeatable,
        repeatIntervalDays: repeatIntervalDays || undefined,
        repeatTimeLimitDays: repeatTimeLimitDays || undefined,
        timerDays: timerDays || undefined,
        isGlobal,
        requirements: validRequirements?.length ? validRequirements : undefined,
      });
    } else {
      addQuest({
        title: title.trim(),
        description: description.trim(),
        flavorText: flavorText.trim() || undefined,
        type: questType,
        category: category || undefined,
        reward,
        recurring: validRequirements?.length ? false : recurring,
        repeatable: validRequirements?.length ? false : repeatable,
        repeatIntervalDays: repeatIntervalDays || undefined,
        repeatTimeLimitDays: repeatTimeLimitDays || undefined,
        timerDays: timerDays || undefined,
        isGlobal,
        requirements: validRequirements?.length ? validRequirements : undefined,
      });
    }

    router.push('/quests');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
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
          { value: 'epic', label: 'Epic Quest' },
          { value: 'normal', label: 'Normal Quest' },
        ]}
      />

      {questType === 'epic' && (
        <div className="border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
          <label className="font-display text-xs uppercase tracking-wider text-primary block">
            Requirements
          </label>
          <p className="font-mono text-[10px] text-outline">
            Add sub-quests that must be completed to finish this epic quest.
          </p>
          {requirements.map((req, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1">
                <Select
                  label="Quest"
                  value={req.questId}
                  onChange={e => {
                    const updated = [...requirements];
                    updated[i] = { ...updated[i], questId: e.target.value };
                    setRequirements(updated);
                  }}
                  options={[
                    { value: '', label: 'Select a quest...' },
                    ...availableQuests.map(q => ({ value: q.id, label: q.title })),
                  ]}
                />
              </div>
              <div className="w-24">
                <Input
                  label="Times"
                  type="number"
                  min={1}
                  value={req.count}
                  onChange={e => {
                    const updated = [...requirements];
                    updated[i] = { ...updated[i], count: Number(e.target.value) };
                    setRequirements(updated);
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => setRequirements(prev => prev.filter((_, idx) => idx !== i))}
                className="text-error font-mono text-xs px-2 py-2 border-2 border-outline-variant
                  hover:bg-error/10 cursor-pointer mb-[2px]"
              >
                X
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setRequirements(prev => [...prev, { questId: '', count: 1 }])}
            className="text-primary font-mono text-xs px-3 py-1 border-2 border-primary/30
              hover:bg-primary/10 cursor-pointer"
          >
            + Add Requirement
          </button>
          {availableQuests.length === 0 && (
            <p className="font-mono text-[10px] text-error">
              No normal quests available. Create some normal quests first to use as requirements.
            </p>
          )}
        </div>
      )}

      <Select
        label="Skill Branch"
        value={category}
        onChange={e => setCategory(e.target.value as QuestCategory | '')}
        options={[
          { value: '', label: 'None' },
          { value: 'mind', label: '📘 Mind — Learning, coding, reading' },
          { value: 'body', label: '💪 Body — Exercise, health' },
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

      {!(questType === 'epic' && requirements.length > 0) && (
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={recurring}
              onChange={e => { setRecurring(e.target.checked); if (e.target.checked) { setRepeatable(false); setRepeatIntervalDays(0); } }}
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
              onChange={e => { setRepeatable(e.target.checked); if (e.target.checked) { setRecurring(false); setRepeatIntervalDays(0); } }}
              className="w-5 h-5 accent-primary bg-surface-lowest"
            />
            <span className="font-mono text-xs uppercase text-on-surface-variant">
              Repeatable (available again after completing)
            </span>
          </label>
        </div>
      )}

      {!recurring && !repeatable && (
        <div className="border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
          <label className="font-display text-xs uppercase tracking-wider text-primary block">
            Scheduled Repeat
          </label>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Repeat every (days)"
              type="number"
              min={0}
              value={repeatIntervalDays}
              onChange={e => setRepeatIntervalDays(Number(e.target.value))}
              placeholder="0"
            />
            <Input
              label="Time limit (days)"
              type="number"
              min={0}
              value={repeatTimeLimitDays}
              onChange={e => setRepeatTimeLimitDays(Number(e.target.value))}
              placeholder="0"
            />
          </div>
          <p className="font-mono text-[10px] text-outline">
            {repeatIntervalDays > 0
              ? `Reappears every ${repeatIntervalDays} day(s) after completion${repeatTimeLimitDays > 0 ? `, ${repeatTimeLimitDays} day(s) to finish` : ''}`
              : 'Set an interval to make this quest repeat on a schedule'}
          </p>
        </div>
      )}

      {!repeatIntervalDays && !recurring && !repeatable && (
        <Input
          label="Time Limit (days, optional)"
          type="number"
          min={0}
          value={timerDays}
          onChange={e => setTimerDays(Number(e.target.value))}
          placeholder="0"
        />
      )}

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
