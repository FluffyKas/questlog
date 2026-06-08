import { type AchievementDef, type AchievementProgress, type AchievementStats, type SkillTreeState } from './types';

export const ACHIEVEMENTS: AchievementDef[] = [
  // One-time milestones
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Complete your first quest',
    icon: '🗡',
    rarity: 'common',
    reward: { gold: 10 },
    condition: { kind: 'quest_count', count: 1 },
  },
  {
    id: 'first_skill',
    name: 'Awakening',
    description: 'Unlock your first skill node',
    icon: '💫',
    rarity: 'common',
    reward: { gold: 15 },
    condition: { kind: 'skill_unlocked', count: 1 },
  },

  // Level milestones
  {
    id: 'level_5',
    name: 'Adventurer',
    description: 'Reach level 5',
    icon: '🌟',
    rarity: 'uncommon',
    reward: { gold: 25, title: 'Adventurer' },
    condition: { kind: 'level', level: 5 },
  },
  {
    id: 'level_10',
    name: 'Veteran',
    description: 'Reach level 10',
    icon: '⭐',
    rarity: 'rare',
    reward: { gold: 50, title: 'Veteran' },
    condition: { kind: 'level', level: 10 },
  },
  {
    id: 'level_25',
    name: 'Champion',
    description: 'Reach level 25',
    icon: '🏅',
    rarity: 'epic',
    reward: { gold: 150, title: 'Champion' },
    condition: { kind: 'level', level: 25 },
  },
  {
    id: 'level_50',
    name: 'Legend',
    description: 'Reach level 50',
    icon: '👑',
    rarity: 'legendary',
    reward: { gold: 500, title: 'Legend' },
    condition: { kind: 'level', level: 50 },
  },

  // Quest count progression
  {
    id: 'quests_5',
    name: 'Novice',
    description: 'Complete 5 quests',
    icon: '📋',
    rarity: 'common',
    reward: { gold: 15 },
    condition: { kind: 'quest_count', count: 5 },
  },
  {
    id: 'quests_25',
    name: 'Journeyman',
    description: 'Complete 25 quests',
    icon: '📜',
    rarity: 'uncommon',
    reward: { gold: 50, title: 'Journeyman' },
    condition: { kind: 'quest_count', count: 25 },
  },
  {
    id: 'quests_100',
    name: 'Expert',
    description: 'Complete 100 quests',
    icon: '🏛',
    rarity: 'rare',
    reward: { gold: 150, title: 'Expert' },
    condition: { kind: 'quest_count', count: 100 },
  },
  {
    id: 'quests_250',
    name: 'Questmaster',
    description: 'Complete 250 quests',
    icon: '🔱',
    rarity: 'epic',
    reward: { gold: 300, title: 'Questmaster' },
    condition: { kind: 'quest_count', count: 250 },
  },

  // Streak
  {
    id: 'streak_3',
    name: 'Consistent',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    rarity: 'common',
    reward: { gold: 10 },
    condition: { kind: 'streak', days: 3 },
  },
  {
    id: 'streak_7',
    name: 'Dedicated',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    rarity: 'uncommon',
    reward: { gold: 30, title: 'Dedicated' },
    condition: { kind: 'streak', days: 7 },
  },
  {
    id: 'streak_14',
    name: 'Relentless',
    description: 'Maintain a 14-day streak',
    icon: '🔥',
    rarity: 'rare',
    reward: { gold: 75, title: 'Relentless' },
    condition: { kind: 'streak', days: 14 },
  },
  {
    id: 'streak_30',
    name: 'Unstoppable',
    description: 'Maintain a 30-day streak',
    icon: '🔥',
    rarity: 'epic',
    reward: { gold: 150, title: 'Unstoppable' },
    condition: { kind: 'streak', days: 30 },
  },

  // Category specialists
  {
    id: 'mind_25',
    name: 'Scholar',
    description: 'Complete 25 Mind quests',
    icon: '📘',
    rarity: 'rare',
    reward: { gold: 40, title: 'Scholar' },
    condition: { kind: 'category_quest_count', category: 'mind', count: 25 },
  },
  {
    id: 'body_25',
    name: 'Warrior',
    description: 'Complete 25 Body quests',
    icon: '⚔',
    rarity: 'rare',
    reward: { gold: 40, title: 'Warrior' },
    condition: { kind: 'category_quest_count', category: 'body', count: 25 },
  },
  {
    id: 'hearth_25',
    name: 'Hearthkeeper',
    description: 'Complete 25 Hearth quests',
    icon: '🏠',
    rarity: 'rare',
    reward: { gold: 40, title: 'Hearthkeeper' },
    condition: { kind: 'category_quest_count', category: 'hearth', count: 25 },
  },

  // Gold milestones
  {
    id: 'gold_500',
    name: 'Coin Collector',
    description: 'Earn 500 gold total',
    icon: '💰',
    rarity: 'uncommon',
    reward: { gold: 25 },
    condition: { kind: 'gold_earned', amount: 500 },
  },
  {
    id: 'gold_2000',
    name: 'Treasure Hunter',
    description: 'Earn 2000 gold total',
    icon: '💎',
    rarity: 'rare',
    reward: { gold: 75, title: 'Treasure Hunter' },
    condition: { kind: 'gold_earned', amount: 2000 },
  },
];

export const DEFAULT_ACHIEVEMENT_PROGRESS: AchievementProgress = {
  unlockedIds: [],
  unlockedAt: {},
  stats: {
    totalQuestsCompleted: 0,
    mainQuestsCompleted: 0,
    dailyQuestsCompleted: 0,
    sideQuestsCompleted: 0,
    mindQuestsCompleted: 0,
    bodyQuestsCompleted: 0,
    hearthQuestsCompleted: 0,
    totalGoldEarned: 0,
  },
};

export function checkAchievement(
  def: AchievementDef,
  stats: AchievementStats,
  heroLevel: number,
  streak: number,
  skillTree: SkillTreeState
): boolean {
  const c = def.condition;
  switch (c.kind) {
    case 'quest_count':
      return stats.totalQuestsCompleted >= c.count;
    case 'quest_type_count':
      if (c.questType === 'epic') return stats.mainQuestsCompleted >= c.count;
      if (c.questType === 'normal') return stats.dailyQuestsCompleted >= c.count;
      return false;
    case 'streak':
      return streak >= c.days;
    case 'level':
      return heroLevel >= c.level;
    case 'gold_earned':
      return stats.totalGoldEarned >= c.amount;
    case 'skill_unlocked':
      return skillTree.unlockedNodes.length >= c.count;
    case 'category_quest_count':
      if (c.category === 'mind') return stats.mindQuestsCompleted >= c.count;
      if (c.category === 'body') return stats.bodyQuestsCompleted >= c.count;
      if (c.category === 'hearth') return stats.hearthQuestsCompleted >= c.count;
      return false;
  }
}

export function getNewlyUnlocked(
  achievements: AchievementProgress,
  heroLevel: number,
  streak: number,
  skillTree: SkillTreeState
): AchievementDef[] {
  return ACHIEVEMENTS.filter(
    def => !achievements.unlockedIds.includes(def.id) &&
      checkAchievement(def, achievements.stats, heroLevel, streak, skillTree)
  );
}

export function getProgress(def: AchievementDef, stats: AchievementStats, heroLevel: number, streak: number, skillTree: SkillTreeState): { current: number; target: number } {
  const c = def.condition;
  switch (c.kind) {
    case 'quest_count':
      return { current: stats.totalQuestsCompleted, target: c.count };
    case 'quest_type_count':
      if (c.questType === 'epic') return { current: stats.mainQuestsCompleted, target: c.count };
      return { current: stats.dailyQuestsCompleted, target: c.count };
    case 'streak':
      return { current: streak, target: c.days };
    case 'level':
      return { current: heroLevel, target: c.level };
    case 'gold_earned':
      return { current: stats.totalGoldEarned, target: c.amount };
    case 'skill_unlocked':
      return { current: skillTree.unlockedNodes.length, target: c.count };
    case 'category_quest_count':
      if (c.category === 'mind') return { current: stats.mindQuestsCompleted, target: c.count };
      if (c.category === 'body') return { current: stats.bodyQuestsCompleted, target: c.count };
      return { current: stats.hearthQuestsCompleted, target: c.count };
  }
}
