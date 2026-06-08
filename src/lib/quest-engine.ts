import { type Quest } from './types';

function getDateString(date: Date, resetHour: number): string {
  const adjusted = new Date(date);
  if (adjusted.getHours() < resetHour) {
    adjusted.setDate(adjusted.getDate() - 1);
  }
  return adjusted.toISOString().split('T')[0];
}

export function shouldResetDaily(quest: Quest, now: Date, resetHour: number): boolean {
  if (!quest.recurring) return false;
  const today = getDateString(now, resetHour);
  return quest.lastResetDate !== today;
}

export function resetDailyQuest(quest: Quest, now: Date, resetHour: number): Quest {
  return {
    ...quest,
    status: 'not_started',
    startedAt: undefined,
    completedAt: undefined,
    lastResetDate: getDateString(now, resetHour),
  };
}

export function getActiveQuests(quests: Quest[]): Quest[] {
  return quests.filter(q => q.status !== 'completed' || (q.recurring && q.recurring));
}

export function getCompletedQuests(quests: Quest[]): Quest[] {
  return quests.filter(q => q.status === 'completed' && !(q.recurring && q.recurring));
}

export function getMissedDailies(quests: Quest[], now: Date, resetHour: number): Quest[] {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getDateString(yesterday, resetHour);

  return quests.filter(q =>
    q.recurring &&
    q.recurring &&
    q.lastResetDate === yesterdayStr &&
    q.status !== 'completed'
  );
}

export function checkStreak(lastActiveDate: string, now: Date, resetHour: number): 'continue' | 'reset' | 'same_day' {
  if (!lastActiveDate) return 'reset';

  const today = getDateString(now, resetHour);
  if (lastActiveDate === today) return 'same_day';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getDateString(yesterday, resetHour);

  if (lastActiveDate === yesterdayStr) return 'continue';
  return 'reset';
}

export function getTodayString(now: Date, resetHour: number): string {
  return getDateString(now, resetHour);
}

export function getExpiredQuests(quests: Quest[]): Quest[] {
  const now = new Date();
  return quests.filter(q =>
    q.deadline &&
    q.status !== 'completed' &&
    new Date(q.deadline) < now
  );
}

export function daysRemaining(deadline: string): number {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getQuestsDueForReactivation(quests: Quest[]): Quest[] {
  const now = Date.now();
  const DAY_MS = 1000 * 60 * 60 * 24;

  return quests.filter(q => {
    if (!q.repeatIntervalDays) return false;
    if (q.status !== 'completed') return false;
    if (!q.completedAt) return false;

    const completedTime = new Date(q.completedAt).getTime();
    const nextActivation = completedTime + q.repeatIntervalDays * DAY_MS;
    return now >= nextActivation;
  });
}

export function reactivateQuest(quest: Quest): Quest {
  const deadline = quest.repeatTimeLimitDays
    ? new Date(Date.now() + quest.repeatTimeLimitDays * 24 * 60 * 60 * 1000).toISOString()
    : undefined;

  return {
    ...quest,
    status: 'not_started',
    startedAt: undefined,
    completedAt: undefined,
    deadline,
  };
}
