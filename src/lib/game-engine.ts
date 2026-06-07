import { type Hero, type QuestReward, type Quest, type SkillTreeState, type SkillNode, type SkillNodeId } from './types';

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(1.5, level - 2));
}

export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

export function calculateLevel(totalXp: number): {
  level: number;
  xpIntoCurrentLevel: number;
  xpForCurrentLevel: number;
} {
  let level = 1;
  let accumulated = 0;

  while (level < 50) {
    const needed = xpForLevel(level + 1);
    if (accumulated + needed > totalXp) {
      return {
        level,
        xpIntoCurrentLevel: totalXp - accumulated,
        xpForCurrentLevel: needed,
      };
    }
    accumulated += needed;
    level++;
  }

  return {
    level: 50,
    xpIntoCurrentLevel: 0,
    xpForCurrentLevel: 1,
  };
}

export function calculateMaxHp(level: number, con: number, maxHpBonus: number = 0): number {
  return 80 + (level * 10) + (con * 5) + maxHpBonus;
}

export function applyQuestReward(hero: Hero, reward: QuestReward): Hero {
  const newXp = hero.xp + reward.xp;
  const { level } = calculateLevel(newXp);
  const newStats = { ...hero.stats };

  if (reward.stats) {
    for (const [stat, value] of Object.entries(reward.stats)) {
      if (value) {
        newStats[stat as keyof typeof newStats] += value;
      }
    }
  }

  const maxHp = calculateMaxHp(level, newStats.con);
  const hpRecovery = 5;

  return {
    ...hero,
    xp: newXp,
    level,
    gold: hero.gold + reward.gold,
    stats: newStats,
    hp: Math.min(hero.hp + hpRecovery, maxHp),
    maxHp,
  };
}

export function checkLevelUp(prevLevel: number, newLevel: number): boolean {
  return newLevel > prevLevel;
}

export interface PerkResult {
  modifiedReward: QuestReward;
  bonusHp: number;
  branchXpEarned: number;
}

export function applyPerks(
  baseReward: QuestReward,
  quest: Quest,
  skillTree: SkillTreeState,
  allNodes: SkillNode[]
): PerkResult {
  let xpMultiplier = 1;
  let bonusGold = 0;
  let bonusHp = 0;
  const branchXpEarned = quest.category ? baseReward.xp : 0;

  for (const nodeId of skillTree.unlockedNodes) {
    const node = allNodes.find(n => n.id === nodeId);
    if (!node) continue;
    const perk = node.perk;

    switch (perk.kind) {
      case 'branch_xp_multiplier':
        if (quest.category === perk.branch) xpMultiplier += perk.multiplier;
        break;
      case 'bonus_gold_daily':
        if (quest.category === perk.branch && quest.type === 'daily') bonusGold += perk.amount;
        break;
      case 'bonus_hp_on_complete':
        if (quest.category === perk.branch) bonusHp += perk.amount;
        break;
      case 'timer_xp_multiplier':
        if (quest.category === perk.branch && quest.timerMinutes && quest.timerMinutes > 0)
          xpMultiplier += perk.multiplier;
        break;
      case 'hp_on_complete_chance':
        if (quest.category === perk.branch && Math.random() < perk.chance)
          bonusHp += perk.amount;
        break;
      case 'double_gold_main':
        if (quest.category === perk.branch && quest.type === 'main') bonusGold += baseReward.gold;
        break;
      case 'double_gold_daily':
        if (quest.category === perk.branch && quest.type === 'daily') bonusGold += baseReward.gold;
        break;
      case 'global_xp_multiplier':
        xpMultiplier += perk.multiplier;
        break;
      case 'global_gold_bonus':
        bonusGold += perk.amount;
        break;
      case 'hp_decay_reduction':
      case 'max_hp_bonus':
      case 'streak_shield':
      case 'stat_boost':
        break;
    }
  }

  return {
    modifiedReward: {
      ...baseReward,
      xp: Math.floor(baseReward.xp * xpMultiplier),
      gold: baseReward.gold + bonusGold,
    },
    bonusHp,
    branchXpEarned,
  };
}

export function getMaxHpBonus(unlockedNodes: SkillNodeId[], allNodes: SkillNode[]): number {
  let bonus = 0;
  for (const nodeId of unlockedNodes) {
    const node = allNodes.find(n => n.id === nodeId);
    if (node?.perk.kind === 'max_hp_bonus') bonus += node.perk.amount;
  }
  return bonus;
}

export function getHpDecayMultiplier(unlockedNodes: SkillNodeId[], allNodes: SkillNode[]): number {
  for (const nodeId of unlockedNodes) {
    const node = allNodes.find(n => n.id === nodeId);
    if (node?.perk.kind === 'hp_decay_reduction') return node.perk.multiplier;
  }
  return 1;
}

export function getStreakShieldAllowance(unlockedNodes: SkillNodeId[], allNodes: SkillNode[]): number {
  for (const nodeId of unlockedNodes) {
    const node = allNodes.find(n => n.id === nodeId);
    if (node?.perk.kind === 'streak_shield') return node.perk.missesAllowed;
  }
  return 0;
}
