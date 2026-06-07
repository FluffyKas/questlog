'use client';

import { createContext, useContext, useReducer, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { type GameState, type Quest, type QuestReward, type ActivityLogEntry, type SkillNodeId, type AchievementProgress } from '@/lib/types';
import {
  loadGameState, saveGameState, initializeGameState,
  loadFromSupabase, saveToSupabase, loadLegacyState, clearLegacyState,
  loadQuestsFromSupabase, insertQuestToSupabase, updateQuestInSupabase,
  deleteQuestFromSupabase, upsertQuestProgress, migrateQuestsFromBlob,
} from '@/lib/storage';
import { applyQuestReward, calculateLevel, calculateMaxHp, checkLevelUp, applyPerks, getMaxHpBonus, getHpDecayMultiplier, getStreakShieldAllowance } from '@/lib/game-engine';
import { shouldResetDaily, resetDailyQuest, checkStreak, getTodayString, getMissedDailies } from '@/lib/quest-engine';
import { MAX_LOG_ENTRIES, SKILL_TREE_NODES, getNodeById, DEFAULT_SKILL_TREE } from '@/lib/constants';
import { ACHIEVEMENTS, getNewlyUnlocked, DEFAULT_ACHIEVEMENT_PROGRESS } from '@/lib/achievements';

type Action =
  | { type: 'INITIALIZE'; state: GameState }
  | { type: 'ADD_QUEST'; quest: Quest }
  | { type: 'EDIT_QUEST'; quest: Quest }
  | { type: 'DELETE_QUEST'; id: string }
  | { type: 'START_QUEST'; id: string }
  | { type: 'COMPLETE_QUEST'; id: string }
  | { type: 'RESET_DAILIES' }
  | { type: 'UPDATE_HERO_NAME'; name: string }
  | { type: 'ADD_LOG'; entry: ActivityLogEntry }
  | { type: 'UPDATE_STREAK' }
  | { type: 'APPLY_HP_DECAY'; amount: number }
  | { type: 'UNLOCK_SKILL_NODE'; nodeId: SkillNodeId }
  | { type: 'CHECK_ACHIEVEMENTS' }
  | { type: 'SET_TITLE'; title: string }
  | { type: 'RESET_PROFILE'; state: GameState };

function createLogEntry(message: string, logType: ActivityLogEntry['type']): ActivityLogEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    message,
    type: logType,
  };
}

function addLog(log: ActivityLogEntry[], entry: ActivityLogEntry): ActivityLogEntry[] {
  return [entry, ...log].slice(0, MAX_LOG_ENTRIES);
}

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'INITIALIZE':
      return action.state;

    case 'ADD_QUEST':
      return {
        ...state,
        quests: [...state.quests, action.quest],
        activityLog: addLog(state.activityLog, createLogEntry(
          `New quest accepted: "${action.quest.title}"`,
          'system'
        )),
      };

    case 'EDIT_QUEST':
      return {
        ...state,
        quests: state.quests.map(q => q.id === action.quest.id ? action.quest : q),
      };

    case 'DELETE_QUEST':
      return {
        ...state,
        quests: state.quests.filter(q => q.id !== action.id),
      };

    case 'START_QUEST': {
      const quest = state.quests.find(q => q.id === action.id);
      if (!quest) return state;
      return {
        ...state,
        quests: state.quests.map(q =>
          q.id === action.id
            ? { ...q, status: 'in_progress' as const, startedAt: new Date().toISOString() }
            : q
        ),
        activityLog: addLog(state.activityLog, createLogEntry(
          `Started Quest "${quest.title}".`,
          'quest_start'
        )),
      };
    }

    case 'COMPLETE_QUEST': {
      const quest = state.quests.find(q => q.id === action.id);
      if (!quest) return state;

      const st = state.skillTree ?? DEFAULT_SKILL_TREE;

      const { modifiedReward, bonusHp, branchXpEarned } = applyPerks(
        quest.reward, quest, st, SKILL_TREE_NODES
      );

      const prevLevel = state.hero.level;
      const maxHpBonus = getMaxHpBonus(st.unlockedNodes, SKILL_TREE_NODES);
      let newHero = applyQuestReward(state.hero, modifiedReward);
      const newMaxHp = calculateMaxHp(newHero.level, newHero.stats.con, maxHpBonus);
      newHero = { ...newHero, maxHp: newMaxHp, hp: Math.min(newHero.hp + bonusHp, newMaxHp) };
      const leveledUp = checkLevelUp(prevLevel, newHero.level);

      let log = state.activityLog;
      log = addLog(log, createLogEntry(
        `Quest Complete: "${quest.title}". +${modifiedReward.xp} XP, +${modifiedReward.gold} Gold.`,
        'quest_complete'
      ));

      if (leveledUp) {
        log = addLog(log, createLogEntry(
          `LEVEL UP! You are now Level ${newHero.level}!`,
          'level_up'
        ));
      }

      const newBranchXp = { ...st.branchXp };
      if (quest.category && branchXpEarned > 0) {
        newBranchXp[quest.category] += branchXpEarned;
      }

      const today = getTodayString(new Date(), state.settings.dailyResetHour);

      const prevAch = state.achievements ?? DEFAULT_ACHIEVEMENT_PROGRESS;
      const newStats = { ...prevAch.stats };
      newStats.totalQuestsCompleted += 1;
      if (quest.type === 'main') newStats.mainQuestsCompleted += 1;
      if (quest.type === 'daily') newStats.dailyQuestsCompleted += 1;
      if (quest.type === 'side') newStats.sideQuestsCompleted += 1;
      if (quest.category === 'mind') newStats.mindQuestsCompleted += 1;
      if (quest.category === 'body') newStats.bodyQuestsCompleted += 1;
      if (quest.category === 'hearth') newStats.hearthQuestsCompleted += 1;
      newStats.totalGoldEarned += modifiedReward.gold;

      const newStreak = (() => {
        const streakStatus = checkStreak(state.streak.lastActiveDate, new Date(), state.settings.dailyResetHour);
        if (streakStatus === 'same_day') return state.streak.current;
        if (streakStatus === 'continue') return state.streak.current + 1;
        return 1;
      })();

      const updatedAchievements: AchievementProgress = { ...prevAch, stats: newStats };
      const newlyUnlocked = getNewlyUnlocked(updatedAchievements, newHero.level, newStreak, { ...st, branchXp: newBranchXp });

      let achievementGold = 0;
      for (const ach of newlyUnlocked) {
        updatedAchievements.unlockedIds = [...updatedAchievements.unlockedIds, ach.id];
        updatedAchievements.unlockedAt = { ...updatedAchievements.unlockedAt, [ach.id]: new Date().toISOString() };
        if (ach.reward.gold) achievementGold += ach.reward.gold;
        log = addLog(log, createLogEntry(
          `Achievement Unlocked: "${ach.name}"!${ach.reward.gold ? ` +${ach.reward.gold} Gold.` : ''}${ach.reward.title ? ` Title earned: "${ach.reward.title}".` : ''}`,
          'system'
        ));
      }
      newHero = { ...newHero, gold: newHero.gold + achievementGold };

      return {
        ...state,
        hero: newHero,
        quests: state.quests.map(q =>
          q.id === action.id
            ? q.repeatable
              ? { ...q, status: 'not_started' as const, completedAt: new Date().toISOString(), startedAt: undefined, lastResetDate: today }
              : { ...q, status: 'completed' as const, completedAt: new Date().toISOString(), lastResetDate: today }
            : q
        ),
        activityLog: log,
        skillTree: { ...st, branchXp: newBranchXp },
        achievements: updatedAchievements,
        streak: {
          ...state.streak,
          lastActiveDate: today,
          current: newStreak,
          longest: Math.max(state.streak.longest, newStreak),
        },
      };
    }

    case 'RESET_DAILIES': {
      const now = new Date();
      const missed = getMissedDailies(state.quests, now, state.settings.dailyResetHour);
      const decayMultiplier = getHpDecayMultiplier((state.skillTree ?? DEFAULT_SKILL_TREE).unlockedNodes, SKILL_TREE_NODES);
      const hpDecay = state.settings.hpDecayEnabled ? Math.floor(missed.length * 10 * decayMultiplier) : 0;

      let log = state.activityLog;
      if (missed.length > 0 && hpDecay > 0) {
        log = addLog(log, createLogEntry(
          `Missed ${missed.length} daily quest(s). -${hpDecay} HP.`,
          'hp_change'
        ));
      }
      log = addLog(log, createLogEntry('Daily quests have been reset.', 'daily_reset'));

      const newHp = Math.max(0, state.hero.hp - hpDecay);

      return {
        ...state,
        hero: { ...state.hero, hp: newHp },
        quests: state.quests.map(q =>
          shouldResetDaily(q, now, state.settings.dailyResetHour)
            ? resetDailyQuest(q, now, state.settings.dailyResetHour)
            : q
        ),
        activityLog: log,
      };
    }

    case 'UPDATE_HERO_NAME':
      return { ...state, hero: { ...state.hero, name: action.name } };

    case 'ADD_LOG':
      return { ...state, activityLog: addLog(state.activityLog, action.entry) };

    case 'UPDATE_STREAK': {
      const streakStatus = checkStreak(state.streak.lastActiveDate, new Date(), state.settings.dailyResetHour);
      if (streakStatus === 'reset' && state.streak.current > 0) {
        const shieldAllowance = getStreakShieldAllowance((state.skillTree ?? DEFAULT_SKILL_TREE).unlockedNodes, SKILL_TREE_NODES);
        if (shieldAllowance > 0) {
          const now = new Date();
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          const shieldUsedThisWeek = state.streak.lastStreakShieldDate &&
            new Date(state.streak.lastStreakShieldDate) >= weekStart;

          if (!shieldUsedThisWeek) {
            return {
              ...state,
              streak: { ...state.streak, lastStreakShieldDate: now.toISOString() },
              activityLog: addLog(state.activityLog, createLogEntry(
                'Streak shield activated! Your streak is protected.',
                'system'
              )),
            };
          }
        }
        return {
          ...state,
          streak: { ...state.streak, current: 0 },
          activityLog: addLog(state.activityLog, createLogEntry(
            'Quest streak broken. Start anew, adventurer!',
            'system'
          )),
        };
      }
      return state;
    }

    case 'APPLY_HP_DECAY':
      return {
        ...state,
        hero: { ...state.hero, hp: Math.max(0, state.hero.hp - action.amount) },
      };

    case 'UNLOCK_SKILL_NODE': {
      const stUnlock = state.skillTree ?? DEFAULT_SKILL_TREE;
      const node = getNodeById(action.nodeId);
      if (!node) return state;
      if (stUnlock.unlockedNodes.includes(action.nodeId)) return state;
      if (stUnlock.branchXp[node.branch] < node.requiredBranchXp) return state;
      if (node.requires && !stUnlock.unlockedNodes.includes(node.requires)) return state;

      const newUnlocked = [...stUnlock.unlockedNodes, action.nodeId];

      let hero = { ...state.hero };
      if (node.perk.kind === 'stat_boost') {
        const newStats = { ...hero.stats };
        for (const [stat, value] of Object.entries(node.perk.stats)) {
          if (value) newStats[stat as keyof typeof newStats] += value;
        }
        const maxHpBonus = getMaxHpBonus(newUnlocked, SKILL_TREE_NODES);
        const maxHp = calculateMaxHp(hero.level, newStats.con, maxHpBonus);
        hero = { ...hero, stats: newStats, maxHp, hp: Math.min(hero.hp, maxHp) };
      }
      if (node.perk.kind === 'max_hp_bonus') {
        const maxHpBonus = getMaxHpBonus(newUnlocked, SKILL_TREE_NODES);
        const maxHp = calculateMaxHp(hero.level, hero.stats.con, maxHpBonus);
        hero = { ...hero, maxHp, hp: hero.hp + node.perk.amount };
      }

      let log = addLog(state.activityLog, createLogEntry(
        `Skill Unlocked: "${node.name}" — ${node.description}`,
        'skill_unlock'
      ));

      const newSkillTree = { ...stUnlock, unlockedNodes: newUnlocked };
      const prevAch = state.achievements ?? DEFAULT_ACHIEVEMENT_PROGRESS;
      const updatedAchievements: AchievementProgress = { ...prevAch, stats: { ...prevAch.stats } };
      const newlyUnlocked = getNewlyUnlocked(updatedAchievements, hero.level, state.streak.current, newSkillTree);

      let achievementGold = 0;
      for (const ach of newlyUnlocked) {
        updatedAchievements.unlockedIds = [...updatedAchievements.unlockedIds, ach.id];
        updatedAchievements.unlockedAt = { ...updatedAchievements.unlockedAt, [ach.id]: new Date().toISOString() };
        if (ach.reward.gold) achievementGold += ach.reward.gold;
        log = addLog(log, createLogEntry(
          `Achievement Unlocked: "${ach.name}"!${ach.reward.gold ? ` +${ach.reward.gold} Gold.` : ''}${ach.reward.title ? ` Title earned: "${ach.reward.title}".` : ''}`,
          'system'
        ));
      }
      hero = { ...hero, gold: hero.gold + achievementGold };

      return {
        ...state,
        hero,
        skillTree: newSkillTree,
        achievements: updatedAchievements,
        activityLog: log,
      };
    }

    case 'CHECK_ACHIEVEMENTS': {
      const achState = state.achievements ?? DEFAULT_ACHIEVEMENT_PROGRESS;
      const st = state.skillTree ?? DEFAULT_SKILL_TREE;
      const newlyUnlocked = getNewlyUnlocked(achState, state.hero.level, state.streak.current, st);
      if (newlyUnlocked.length === 0) return state;

      let hero = { ...state.hero };
      let log = state.activityLog;
      const updated: AchievementProgress = { ...achState, unlockedIds: [...achState.unlockedIds], unlockedAt: { ...achState.unlockedAt } };

      for (const ach of newlyUnlocked) {
        updated.unlockedIds.push(ach.id);
        updated.unlockedAt[ach.id] = new Date().toISOString();
        if (ach.reward.gold) hero = { ...hero, gold: hero.gold + ach.reward.gold };
        log = addLog(log, createLogEntry(
          `Achievement Unlocked: "${ach.name}"!${ach.reward.gold ? ` +${ach.reward.gold} Gold.` : ''}${ach.reward.title ? ` Title earned: "${ach.reward.title}".` : ''}`,
          'system'
        ));
      }

      return { ...state, hero, achievements: updated, activityLog: log };
    }

    case 'SET_TITLE':
      return { ...state, hero: { ...state.hero, title: action.title || undefined } };

    case 'RESET_PROFILE':
      return action.state;

    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  isLoaded: boolean;
  userId: string;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const [state, dispatch] = useReducer(gameReducer, null as unknown as GameState);
  const isLoaded = useRef(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>(null);
  const supabaseSaveTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      let baseState = await loadFromSupabase(userId);

      if (!baseState) {
        baseState = loadGameState(userId);
        if (!baseState) {
          const legacy = loadLegacyState();
          if (legacy) {
            baseState = legacy;
            clearLegacyState();
          }
        }
      }

      if (!baseState) {
        baseState = initializeGameState();
      }

      if (cancelled) return;

      // Migrate quests from JSONB blob to quests table (one-time)
      if (baseState.quests.length > 0) {
        await migrateQuestsFromBlob(userId, baseState.quests);
        baseState = { ...baseState, quests: [] };
        saveToSupabase(userId, baseState);
        saveGameState(baseState, userId);
      }

      // Load quests from the dedicated tables
      const quests = await loadQuestsFromSupabase(userId);
      if (cancelled) return;

      const finalState = { ...baseState, quests };
      dispatch({ type: 'INITIALIZE', state: finalState });
      isLoaded.current = true;
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  // Save non-quest state to game_saves (debounced)
  useEffect(() => {
    if (!state || !isLoaded.current) return;

    const stateForStorage = { ...state, quests: [] };

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveGameState(stateForStorage, userId);
    }, 300);

    if (supabaseSaveTimeout.current) clearTimeout(supabaseSaveTimeout.current);
    supabaseSaveTimeout.current = setTimeout(() => {
      saveToSupabase(userId, stateForStorage);
    }, 1000);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      if (supabaseSaveTimeout.current) clearTimeout(supabaseSaveTimeout.current);
    };
  }, [state, userId]);

  // Daily reset + streak check
  useEffect(() => {
    if (!state || !isLoaded.current) return;

    const now = new Date();
    const questsToReset = state.quests.filter(q =>
      shouldResetDaily(q, now, state.settings.dailyResetHour)
    );
    if (questsToReset.length > 0) {
      dispatch({ type: 'RESET_DAILIES' });
      for (const q of questsToReset) {
        const resetDate = getTodayString(now, state.settings.dailyResetHour);
        upsertQuestProgress(userId, q.id, {
          status: 'not_started',
          started_at: null,
          completed_at: null,
          last_reset_date: resetDate,
        });
      }
    }

    dispatch({ type: 'UPDATE_STREAK' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!state]);

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-surface">
        <p className="font-display text-primary text-lg animate-pulse">Loading QuestLog...</p>
      </div>
    );
  }

  return (
    <GameContext.Provider value={{ state, dispatch, isLoaded: isLoaded.current, userId }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameState() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameState must be used within GameProvider');
  return ctx;
}

export function useHero() {
  const { state, dispatch } = useGameState();
  const hero = state.hero;
  const levelInfo = calculateLevel(hero.xp);

  return {
    hero,
    level: levelInfo.level,
    xpIntoCurrentLevel: levelInfo.xpIntoCurrentLevel,
    xpForCurrentLevel: levelInfo.xpForCurrentLevel,
    xpPercent: levelInfo.xpForCurrentLevel > 0
      ? Math.floor((levelInfo.xpIntoCurrentLevel / levelInfo.xpForCurrentLevel) * 100)
      : 100,
    hpPercent: hero.maxHp > 0 ? Math.floor((hero.hp / hero.maxHp) * 100) : 100,
    setName: (name: string) => dispatch({ type: 'UPDATE_HERO_NAME', name }),
  };
}

export function useQuests() {
  const { state, dispatch, userId } = useGameState();

  const addQuest = useCallback((quest: Omit<Quest, 'id' | 'createdAt' | 'status' | 'userId'>) => {
    const newQuest: Quest = {
      ...quest,
      id: crypto.randomUUID(),
      userId,
      isGlobal: quest.isGlobal ?? false,
      createdAt: new Date().toISOString(),
      status: 'not_started',
      lastResetDate: quest.recurring ? getTodayString(new Date(), state.settings.dailyResetHour) : undefined,
    };
    dispatch({ type: 'ADD_QUEST', quest: newQuest });
    insertQuestToSupabase(newQuest);
    return newQuest;
  }, [dispatch, userId, state.settings.dailyResetHour]);

  const editQuest = useCallback((quest: Quest) => {
    dispatch({ type: 'EDIT_QUEST', quest });
    updateQuestInSupabase(quest);
  }, [dispatch]);

  const deleteQuest = useCallback((id: string) => {
    dispatch({ type: 'DELETE_QUEST', id });
    deleteQuestFromSupabase(id);
  }, [dispatch]);

  const startQuest = useCallback((id: string) => {
    dispatch({ type: 'START_QUEST', id });
    upsertQuestProgress(userId, id, {
      status: 'in_progress',
      started_at: new Date().toISOString(),
    });
  }, [dispatch, userId]);

  const completeQuest = useCallback((id: string) => {
    const quest = state.quests.find(q => q.id === id);
    dispatch({ type: 'COMPLETE_QUEST', id });

    if (quest) {
      const today = getTodayString(new Date(), state.settings.dailyResetHour);
      const now = new Date().toISOString();
      if (quest.repeatable) {
        upsertQuestProgress(userId, id, {
          status: 'not_started',
          started_at: null,
          completed_at: now,
          last_reset_date: today,
        });
      } else {
        upsertQuestProgress(userId, id, {
          status: 'completed',
          completed_at: now,
          last_reset_date: today,
        });
      }
    }
  }, [dispatch, userId, state.quests, state.settings.dailyResetHour]);

  return {
    quests: state.quests,
    activeQuests: state.quests.filter(q => q.status !== 'completed'),
    completedQuests: state.quests.filter(q => q.status === 'completed' && !q.recurring && !q.repeatable),
    addQuest,
    editQuest,
    deleteQuest,
    startQuest,
    completeQuest,
    userId,
  };
}

export function useActivityLog() {
  const { state } = useGameState();
  return { log: state.activityLog };
}

export function useAchievements() {
  const { state, dispatch } = useGameState();
  const achievements = state.achievements ?? DEFAULT_ACHIEVEMENT_PROGRESS;
  const st = state.skillTree ?? DEFAULT_SKILL_TREE;

  const unlockedTitles = ACHIEVEMENTS
    .filter(a => achievements.unlockedIds.includes(a.id) && a.reward.title)
    .map(a => a.reward.title!);

  const setTitle = useCallback((title: string) => {
    dispatch({ type: 'SET_TITLE', title });
  }, [dispatch]);

  return { achievements, unlockedTitles, setTitle, hero: state.hero, streak: state.streak, skillTree: st };
}

export function useSkillTree() {
  const { state, dispatch } = useGameState();
  const skillTree = state.skillTree ?? { branchXp: { mind: 0, body: 0, hearth: 0 }, unlockedNodes: [] as SkillNodeId[], forkChoices: {} };

  const unlockNode = useCallback((nodeId: SkillNodeId) => {
    dispatch({ type: 'UNLOCK_SKILL_NODE', nodeId });
  }, [dispatch]);

  const canUnlock = useCallback((node: { id: SkillNodeId; branch: string; requiredBranchXp: number; requires?: SkillNodeId }) => {
    if (skillTree.unlockedNodes.includes(node.id)) return false;
    if (skillTree.branchXp[node.branch as keyof typeof skillTree.branchXp] < node.requiredBranchXp) return false;
    if (node.requires && !skillTree.unlockedNodes.includes(node.requires)) return false;
    return true;
  }, [skillTree]);

  const isUnlocked = useCallback((nodeId: SkillNodeId) => {
    return skillTree.unlockedNodes.includes(nodeId);
  }, [skillTree]);

  const isForkLocked = useCallback(() => false, []);

  return { skillTree, unlockNode, canUnlock, isUnlocked, isForkLocked };
}
