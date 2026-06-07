import { type Hero, type AppSettings, type StreakData, type GameState, type AchievementProgress, type QuestType, type QuestCategory, type SkillNode, type SkillNodeId, type SkillTreeState } from './types';
import { DEFAULT_ACHIEVEMENT_PROGRESS } from './achievements';

export const STORAGE_KEY = 'questlog_state';
export const STATE_VERSION = 3;
export const MAX_LOG_ENTRIES = 100;
export const MAX_LEVEL = 50;

export const STAT_LABELS: Record<string, string> = {
  str: 'Strength',
  int: 'Intelligence',
  wis: 'Wisdom',
  dex: 'Dexterity',
  cha: 'Charisma',
  con: 'Constitution',
};

export const QUEST_TYPE_CONFIG: Record<QuestType, { label: string; defaultXp: number; defaultGold: number }> = {
  main: { label: 'Main Quest', defaultXp: 100, defaultGold: 30 },
  daily: { label: 'Daily Grind', defaultXp: 25, defaultGold: 10 },
  side: { label: 'Side Quest', defaultXp: 50, defaultGold: 15 },
};

export const QUEST_CATEGORY_CONFIG: Record<QuestCategory, { label: string; color: string; icon: string }> = {
  mind: { label: 'Mind', color: 'info', icon: '📘' },
  body: { label: 'Body', color: 'error', icon: '💪' },
  hearth: { label: 'Hearth', color: 'mana', icon: '🏠' },
};

export const SKILL_TREE_NODES: SkillNode[] = [
  // Mind branch
  { id: 'mind_1', branch: 'mind', name: 'Keen Mind', description: '+15% XP from Mind quests',
    icon: '🧠', requiredBranchXp: 100,
    perk: { kind: 'branch_xp_multiplier', branch: 'mind', multiplier: 0.15 } },
  { id: 'mind_2', branch: 'mind', name: 'Quick Study', description: 'Mind daily quests give +5 gold',
    icon: '📖', requiredBranchXp: 300, requires: 'mind_1',
    perk: { kind: 'bonus_gold_daily', branch: 'mind', amount: 5 } },
  { id: 'mind_3', branch: 'mind', name: 'Mental Fortitude', description: 'Mind quests restore +5 HP',
    icon: '🛡', requiredBranchXp: 600, requires: 'mind_2',
    perk: { kind: 'bonus_hp_on_complete', branch: 'mind', amount: 5 } },
  { id: 'mind_scholar_1', branch: 'mind', name: 'Deep Focus', description: 'Mind timed quests give +25% XP',
    icon: '🔬', requiredBranchXp: 1000, requires: 'mind_3', forkGroup: 'mind_fork',
    perk: { kind: 'timer_xp_multiplier', branch: 'mind', multiplier: 0.25 } },
  { id: 'mind_scholar_2', branch: 'mind', name: 'Sage', description: '+1 Wisdom permanently',
    icon: '📜', requiredBranchXp: 1500, requires: 'mind_scholar_1', forkGroup: 'mind_fork',
    perk: { kind: 'stat_boost', stats: { wis: 1 } } },
  { id: 'mind_creator_1', branch: 'mind', name: 'Inspiration', description: '25% chance Mind quests give +10 HP',
    icon: '💡', requiredBranchXp: 1000, requires: 'mind_3', forkGroup: 'mind_fork',
    perk: { kind: 'hp_on_complete_chance', branch: 'mind', chance: 0.25, amount: 10 } },
  { id: 'mind_creator_2', branch: 'mind', name: 'Visionary', description: '+1 Charisma permanently',
    icon: '🌟', requiredBranchXp: 1500, requires: 'mind_creator_1', forkGroup: 'mind_fork',
    perk: { kind: 'stat_boost', stats: { cha: 1 } } },

  // Body branch
  { id: 'body_1', branch: 'body', name: 'Tough Skin', description: '+15% XP from Body quests',
    icon: '💪', requiredBranchXp: 100,
    perk: { kind: 'branch_xp_multiplier', branch: 'body', multiplier: 0.15 } },
  { id: 'body_2', branch: 'body', name: 'Second Wind', description: 'Body quests restore +10 HP',
    icon: '💨', requiredBranchXp: 300, requires: 'body_1',
    perk: { kind: 'bonus_hp_on_complete', branch: 'body', amount: 10 } },
  { id: 'body_3', branch: 'body', name: 'Endurance', description: 'HP decay from missed dailies reduced 50%',
    icon: '🏋', requiredBranchXp: 600, requires: 'body_2',
    perk: { kind: 'hp_decay_reduction', multiplier: 0.5 } },
  { id: 'body_warrior_1', branch: 'body', name: 'Battle Hardened', description: 'Body main quests give double gold',
    icon: '⚔', requiredBranchXp: 1000, requires: 'body_3', forkGroup: 'body_fork',
    perk: { kind: 'double_gold_main', branch: 'body' } },
  { id: 'body_warrior_2', branch: 'body', name: 'Champion', description: '+1 STR, +1 CON permanently',
    icon: '🏆', requiredBranchXp: 1500, requires: 'body_warrior_1', forkGroup: 'body_fork',
    perk: { kind: 'stat_boost', stats: { str: 1, con: 1 } } },
  { id: 'body_ranger_1', branch: 'body', name: 'Steady Pace', description: 'Body daily quests give double gold',
    icon: '🏹', requiredBranchXp: 1000, requires: 'body_3', forkGroup: 'body_fork',
    perk: { kind: 'double_gold_daily', branch: 'body' } },
  { id: 'body_ranger_2', branch: 'body', name: 'Survivalist', description: 'Max HP +25 permanently',
    icon: '🌿', requiredBranchXp: 1500, requires: 'body_ranger_1', forkGroup: 'body_fork',
    perk: { kind: 'max_hp_bonus', amount: 25 } },

  // Hearth branch
  { id: 'hearth_1', branch: 'hearth', name: 'Tidy Up', description: '+15% XP from Hearth quests',
    icon: '🧹', requiredBranchXp: 100,
    perk: { kind: 'branch_xp_multiplier', branch: 'hearth', multiplier: 0.15 } },
  { id: 'hearth_2', branch: 'hearth', name: 'Homekeeper', description: '1 missed day/week won\'t break streak',
    icon: '🏡', requiredBranchXp: 300, requires: 'hearth_1',
    perk: { kind: 'streak_shield', missesAllowed: 1 } },
  { id: 'hearth_3', branch: 'hearth', name: 'Deep Clean', description: 'Hearth quests restore +10 HP',
    icon: '✨', requiredBranchXp: 600, requires: 'hearth_2',
    perk: { kind: 'bonus_hp_on_complete', branch: 'hearth', amount: 10 } },
  { id: 'hearth_steward_1', branch: 'hearth', name: 'Efficient Routine', description: 'All quests give +5% XP',
    icon: '📋', requiredBranchXp: 1000, requires: 'hearth_3', forkGroup: 'hearth_fork',
    perk: { kind: 'global_xp_multiplier', multiplier: 0.05 } },
  { id: 'hearth_steward_2', branch: 'hearth', name: 'Grand Steward', description: '+1 WIS, +1 INT permanently',
    icon: '👑', requiredBranchXp: 1500, requires: 'hearth_steward_1', forkGroup: 'hearth_fork',
    perk: { kind: 'stat_boost', stats: { wis: 1, int: 1 } } },
  { id: 'hearth_artisan_1', branch: 'hearth', name: 'Home Comfort', description: 'All quests give +3 gold',
    icon: '🛋', requiredBranchXp: 1000, requires: 'hearth_3', forkGroup: 'hearth_fork',
    perk: { kind: 'global_gold_bonus', amount: 3 } },
  { id: 'hearth_artisan_2', branch: 'hearth', name: 'Master Artisan', description: '+1 CHA, +1 DEX permanently',
    icon: '🎨', requiredBranchXp: 1500, requires: 'hearth_artisan_1', forkGroup: 'hearth_fork',
    perk: { kind: 'stat_boost', stats: { cha: 1, dex: 1 } } },
];

export const DEFAULT_SKILL_TREE: SkillTreeState = {
  branchXp: { mind: 0, body: 0, hearth: 0 },
  unlockedNodes: [],
  forkChoices: {},
};

export function getNodesByBranch(branch: QuestCategory): SkillNode[] {
  return SKILL_TREE_NODES.filter(n => n.branch === branch);
}

export function getNodeById(id: SkillNodeId): SkillNode | undefined {
  return SKILL_TREE_NODES.find(n => n.id === id);
}

export const DEFAULT_SETTINGS: AppSettings = {
  dailyResetHour: 4,
  hpDecayEnabled: true,
  soundEnabled: true,
};

export const DEFAULT_HERO: Hero = {
  name: 'Adventurer',
  level: 1,
  xp: 0,
  hp: 95,
  maxHp: 95,
  gold: 0,
  stats: { str: 1, int: 1, wis: 1, dex: 1, cha: 1, con: 1 },
  createdAt: '',
};

export const DEFAULT_STREAK: StreakData = {
  current: 0,
  longest: 0,
  lastActiveDate: '',
};

export function createInitialState(): GameState {
  return {
    hero: { ...DEFAULT_HERO, createdAt: new Date().toISOString() },
    quests: [],
    inventory: [],
    activityLog: [{
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      message: 'Hero logged in. A new adventure begins!',
      type: 'system',
    }],
    streak: { ...DEFAULT_STREAK },
    skillTree: { ...DEFAULT_SKILL_TREE, branchXp: { ...DEFAULT_SKILL_TREE.branchXp } },
    achievements: { ...DEFAULT_ACHIEVEMENT_PROGRESS, stats: { ...DEFAULT_ACHIEVEMENT_PROGRESS.stats } },
    settings: { ...DEFAULT_SETTINGS },
    version: STATE_VERSION,
  };
}
