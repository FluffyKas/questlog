import { type GameState } from './types';
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

  return migrated;
}
