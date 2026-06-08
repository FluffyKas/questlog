import { type GameState, type Quest, type QuestStatus, type QuestType, type QuestCategory, type QuestReward } from './types';
import { STORAGE_KEY, STATE_VERSION, createInitialState, DEFAULT_SKILL_TREE } from './constants';
import { DEFAULT_ACHIEVEMENT_PROGRESS } from './achievements';
import { supabase } from './supabase';

function storageKeyForUser(userId: string): string {
  return `${STORAGE_KEY}_${userId}`;
}

export function loadGameState(userId?: string): GameState | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = userId ? storageKeyForUser(userId) : STORAGE_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const state = JSON.parse(raw) as GameState;
    return migrateState(state);
  } catch {
    return null;
  }
}

export function saveGameState(state: GameState, userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = userId ? storageKeyForUser(userId) : STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable
  }
}

export async function loadFromSupabase(userId: string): Promise<GameState | null> {
  try {
    const { data, error } = await supabase
      .from('game_saves')
      .select('state')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return migrateState(data.state as GameState);
  } catch {
    return null;
  }
}

export async function saveToSupabase(userId: string, state: GameState): Promise<void> {
  try {
    await supabase
      .from('game_saves')
      .upsert({ user_id: userId, state, updated_at: new Date().toISOString() });
  } catch {
    // offline or error — localStorage is the fallback
  }
}

export function loadLegacyState(): GameState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return migrateState(JSON.parse(raw) as GameState);
  } catch {
    return null;
  }
}

export function clearLegacyState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function initializeGameState(): GameState {
  return createInitialState();
}

// --- Quest table operations ---

interface QuestRow {
  id: string;
  user_id: string;
  is_global: boolean;
  title: string;
  description: string;
  flavor_text: string | null;
  type: string;
  category: string | null;
  reward: QuestReward;
  recurring: boolean;
  repeatable: boolean;
  repeat_interval_days: number | null;
  repeat_time_limit_days: number | null;
  timer_days: number | null;
  deadline: string | null;
  created_at: string;
}

interface ProgressRow {
  quest_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  last_reset_date: string | null;
}

export async function loadQuestsFromSupabase(userId: string): Promise<Quest[]> {
  try {
    const [questResult, progressResult] = await Promise.all([
      supabase.from('quests').select('*'),
      supabase.from('quest_progress').select('*').eq('user_id', userId),
    ]);

    if (questResult.error || !questResult.data) return [];

    const progressMap = new Map<string, ProgressRow>();
    if (progressResult.data) {
      for (const p of progressResult.data as ProgressRow[]) {
        progressMap.set(p.quest_id, p);
      }
    }

    return (questResult.data as QuestRow[]).map(q => {
      const progress = progressMap.get(q.id);
      return {
        id: q.id,
        userId: q.user_id,
        isGlobal: q.is_global,
        title: q.title,
        description: q.description,
        flavorText: q.flavor_text || undefined,
        type: q.type as QuestType,
        category: (q.category as QuestCategory) || undefined,
        reward: q.reward,
        recurring: q.recurring,
        repeatable: q.repeatable,
        repeatIntervalDays: q.repeat_interval_days || undefined,
        repeatTimeLimitDays: q.repeat_time_limit_days || undefined,
        timerDays: q.timer_days || undefined,
        deadline: q.deadline || undefined,
        createdAt: q.created_at,
        status: (progress?.status as QuestStatus) || 'not_started',
        startedAt: progress?.started_at || undefined,
        completedAt: progress?.completed_at || undefined,
        lastResetDate: progress?.last_reset_date || undefined,
      };
    });
  } catch {
    return [];
  }
}

export async function insertQuestToSupabase(quest: Quest): Promise<void> {
  try {
    await supabase.from('quests').insert({
      id: quest.id,
      user_id: quest.userId,
      is_global: quest.isGlobal,
      title: quest.title,
      description: quest.description,
      flavor_text: quest.flavorText || null,
      type: quest.type,
      category: quest.category || null,
      reward: quest.reward,
      recurring: quest.recurring,
      repeatable: quest.repeatable,
      repeat_interval_days: quest.repeatIntervalDays || null,
      repeat_time_limit_days: quest.repeatTimeLimitDays || null,
      timer_days: quest.timerDays || null,
      deadline: quest.deadline || null,
      created_at: quest.createdAt,
    });
  } catch {
    // silent fail — state is already updated in memory
  }
}

export async function updateQuestInSupabase(quest: Quest): Promise<void> {
  try {
    await supabase.from('quests').update({
      title: quest.title,
      description: quest.description,
      flavor_text: quest.flavorText || null,
      type: quest.type,
      category: quest.category || null,
      reward: quest.reward,
      recurring: quest.recurring,
      repeatable: quest.repeatable,
      repeat_interval_days: quest.repeatIntervalDays || null,
      repeat_time_limit_days: quest.repeatTimeLimitDays || null,
      timer_days: quest.timerDays || null,
      deadline: quest.deadline || null,
      is_global: quest.isGlobal,
    }).eq('id', quest.id);
  } catch {
    // silent fail
  }
}

export async function deleteQuestFromSupabase(questId: string): Promise<void> {
  try {
    await supabase.from('quests').delete().eq('id', questId);
  } catch {
    // silent fail
  }
}

export async function upsertQuestProgress(
  userId: string,
  questId: string,
  progress: { status: string; started_at?: string | null; completed_at?: string | null; last_reset_date?: string | null },
): Promise<void> {
  try {
    await supabase.from('quest_progress').upsert({
      user_id: userId,
      quest_id: questId,
      ...progress,
    });
  } catch {
    // silent fail
  }
}

export async function migrateQuestsFromBlob(userId: string, quests: Quest[]): Promise<void> {
  if (quests.length === 0) return;

  try {
    const questRows = quests.map(q => ({
      id: q.id,
      user_id: userId,
      is_global: false,
      title: q.title,
      description: q.description,
      flavor_text: q.flavorText || null,
      type: q.type,
      category: q.category || null,
      reward: q.reward,
      recurring: q.recurring,
      repeatable: q.repeatable,
      repeat_interval_days: q.repeatIntervalDays || null,
      repeat_time_limit_days: q.repeatTimeLimitDays || null,
      timer_days: q.timerDays || null,
      deadline: q.deadline || null,
      created_at: q.createdAt,
    }));

    await supabase.from('quests').upsert(questRows);

    const progressRows = quests
      .filter(q => q.status !== 'not_started' || q.lastResetDate)
      .map(q => ({
        user_id: userId,
        quest_id: q.id,
        status: q.status,
        started_at: q.startedAt || null,
        completed_at: q.completedAt || null,
        last_reset_date: q.lastResetDate || null,
      }));

    if (progressRows.length > 0) {
      await supabase.from('quest_progress').upsert(progressRows);
    }
  } catch {
    // migration failed — will retry on next load
  }
}

// --- State migration ---

function migrateState(state: GameState): GameState {
  let migrated = state;

  if (!migrated.version || migrated.version < 2) {
    migrated = {
      ...createInitialState(),
      ...migrated,
      skillTree: { ...DEFAULT_SKILL_TREE, branchXp: { ...DEFAULT_SKILL_TREE.branchXp } },
      version: 2,
    };
  }

  if (!migrated.skillTree) {
    migrated = {
      ...migrated,
      skillTree: { ...DEFAULT_SKILL_TREE, branchXp: { ...DEFAULT_SKILL_TREE.branchXp } },
    };
  }

  const branchXp = migrated.skillTree.branchXp as Record<string, number>;
  if ('spirit' in branchXp && !('hearth' in branchXp)) {
    migrated = {
      ...migrated,
      skillTree: {
        ...migrated.skillTree,
        branchXp: { mind: branchXp.mind ?? 0, body: branchXp.body ?? 0, hearth: branchXp.spirit ?? 0 },
      },
    };
  } else if (!('hearth' in branchXp)) {
    migrated = {
      ...migrated,
      skillTree: {
        ...migrated.skillTree,
        branchXp: { mind: branchXp.mind ?? 0, body: branchXp.body ?? 0, hearth: 0 },
      },
    };
  }

  if (!migrated.version || migrated.version < 3) {
    migrated = {
      ...migrated,
      achievements: { ...DEFAULT_ACHIEVEMENT_PROGRESS, stats: { ...DEFAULT_ACHIEVEMENT_PROGRESS.stats } },
      version: 3,
    };
  }

  if (!migrated.achievements) {
    migrated = {
      ...migrated,
      achievements: { ...DEFAULT_ACHIEVEMENT_PROGRESS, stats: { ...DEFAULT_ACHIEVEMENT_PROGRESS.stats } },
    };
  }

  if (!migrated.version || migrated.version < 4) {
    const typeMap: Record<string, string> = { main: 'epic', daily: 'normal', side: 'normal' };
    migrated = {
      ...migrated,
      quests: migrated.quests.map(q => ({
        ...q,
        type: (typeMap[q.type] ?? q.type) as GameState['quests'][number]['type'],
      })),
      version: 4,
    };
  }

  return migrated;
}
