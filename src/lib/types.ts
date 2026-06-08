export type QuestType = 'epic' | 'normal';
export type QuestStatus = 'not_started' | 'in_progress' | 'completed';
export type StatName = 'str' | 'int' | 'wis' | 'dex' | 'cha' | 'con';
export type QuestCategory = 'mind' | 'body' | 'hearth';

export type SkillNodeId =
  | 'mind_1' | 'mind_2' | 'mind_3'
  | 'mind_scholar_1' | 'mind_scholar_2'
  | 'mind_creator_1' | 'mind_creator_2'
  | 'body_1' | 'body_2' | 'body_3'
  | 'body_warrior_1' | 'body_warrior_2'
  | 'body_ranger_1' | 'body_ranger_2'
  | 'hearth_1' | 'hearth_2' | 'hearth_3'
  | 'hearth_steward_1' | 'hearth_steward_2'
  | 'hearth_artisan_1' | 'hearth_artisan_2';

export type PerkEffect =
  | { kind: 'branch_xp_multiplier'; branch: QuestCategory; multiplier: number }
  | { kind: 'bonus_gold_daily'; branch: QuestCategory; amount: number }
  | { kind: 'bonus_hp_on_complete'; branch: QuestCategory; amount: number }
  | { kind: 'timer_xp_multiplier'; branch: QuestCategory; multiplier: number }
  | { kind: 'hp_on_complete_chance'; branch: QuestCategory; chance: number; amount: number }
  | { kind: 'hp_decay_reduction'; multiplier: number }
  | { kind: 'double_gold_daily'; branch: QuestCategory }
  | { kind: 'double_gold_main'; branch: QuestCategory }
  | { kind: 'max_hp_bonus'; amount: number }
  | { kind: 'global_xp_multiplier'; multiplier: number }
  | { kind: 'global_gold_bonus'; amount: number }
  | { kind: 'streak_shield'; missesAllowed: number }
  | { kind: 'stat_boost'; stats: Partial<Record<StatName, number>> };

export interface SkillNode {
  id: SkillNodeId;
  branch: QuestCategory;
  name: string;
  description: string;
  icon: string;
  requiredBranchXp: number;
  requires?: SkillNodeId;
  forkGroup?: string;
  perk: PerkEffect;
}

export interface SkillTreeState {
  branchXp: Record<QuestCategory, number>;
  unlockedNodes: SkillNodeId[];
  forkChoices: Partial<Record<string, SkillNodeId>>;
}

export interface QuestReward {
  xp: number;
  gold: number;
  stats?: Partial<Record<StatName, number>>;
  title?: string;
}

export interface EpicQuestRequirement {
  questId: string;
  count: number;
}

export interface Quest {
  id: string;
  userId?: string;
  isGlobal: boolean;
  title: string;
  description: string;
  flavorText?: string;
  type: QuestType;
  status: QuestStatus;
  reward: QuestReward;
  category?: QuestCategory;
  createdAt: string;
  completedAt?: string;
  startedAt?: string;
  deadline?: string;
  timerDays?: number;
  recurring: boolean;
  repeatable: boolean;
  repeatIntervalDays?: number;
  repeatTimeLimitDays?: number;
  lastResetDate?: string;
  requirements?: EpicQuestRequirement[];
}

export interface HeroStats {
  str: number;
  int: number;
  wis: number;
  dex: number;
  cha: number;
  con: number;
}

export interface Hero {
  name: string;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  gold: number;
  stats: HeroStats;
  title?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  quantity: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'quest_complete' | 'level_up' | 'xp_gain' | 'gold_gain'
    | 'quest_start' | 'daily_reset' | 'hp_change' | 'system' | 'skill_unlock';
}

export interface StreakData {
  current: number;
  longest: number;
  lastActiveDate: string;
  lastStreakShieldDate?: string;
}

export interface AppSettings {
  dailyResetHour: number;
  hpDecayEnabled: boolean;
  soundEnabled: boolean;
}

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type AchievementCondition =
  | { kind: 'quest_count'; count: number }
  | { kind: 'quest_type_count'; questType: QuestType; count: number }
  | { kind: 'streak'; days: number }
  | { kind: 'level'; level: number }
  | { kind: 'gold_earned'; amount: number }
  | { kind: 'skill_unlocked'; count: number }
  | { kind: 'category_quest_count'; category: QuestCategory; count: number }
  | { kind: 'epic_quest_complete'; count: number }
  | { kind: 'epic_quest_id_complete'; questTitle: string };

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  reward: { gold?: number; title?: string };
  condition: AchievementCondition;
}

export interface AchievementStats {
  totalQuestsCompleted: number;
  mainQuestsCompleted: number;
  dailyQuestsCompleted: number;
  sideQuestsCompleted: number;
  mindQuestsCompleted: number;
  bodyQuestsCompleted: number;
  hearthQuestsCompleted: number;
  totalGoldEarned: number;
  epicQuestsCompleted: number;
  completedEpicQuestTitles: string[];
}

export interface AchievementProgress {
  unlockedIds: string[];
  unlockedAt: Record<string, string>;
  stats: AchievementStats;
}

export interface GameState {
  hero: Hero;
  quests: Quest[];
  inventory: InventoryItem[];
  activityLog: ActivityLogEntry[];
  streak: StreakData;
  skillTree: SkillTreeState;
  achievements: AchievementProgress;
  questCompletionCounts: Record<string, number>;
  settings: AppSettings;
  version: number;
}
