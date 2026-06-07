'use client';

import { type Quest } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useQuests } from '@/components/providers/GameProvider';
import { QUEST_TYPE_CONFIG, QUEST_CATEGORY_CONFIG } from '@/lib/constants';
import { daysRemaining } from '@/lib/quest-engine';

interface QuestCardProps {
  quest: Quest;
}

const typeToRibbon: Record<string, 'primary' | 'secondary' | 'tertiary'> = {
  main: 'primary',
  daily: 'secondary',
  side: 'tertiary',
};

export function QuestCard({ quest }: QuestCardProps) {
  const { startQuest, completeQuest } = useQuests();
  const config = QUEST_TYPE_CONFIG[quest.type];

  return (
    <Card
      ribbonTitle={config.label}
      ribbonVariant={typeToRibbon[quest.type]}
    >
      <h3 className="font-display text-sm text-on-surface mb-1">{quest.title}</h3>
      {quest.description && (
        <p className="font-body text-xs text-on-surface-variant mb-1">{quest.description}</p>
      )}
      {quest.flavorText && (
        <p className="font-body text-xs text-outline italic mb-2">&quot;{quest.flavorText}&quot;</p>
      )}

      <div className="flex flex-wrap gap-1 mb-3">
        {quest.category && (
          <Badge variant="default">
            {QUEST_CATEGORY_CONFIG[quest.category].icon} {QUEST_CATEGORY_CONFIG[quest.category].label}
          </Badge>
        )}
        <Badge variant="xp">+{quest.reward.xp} XP</Badge>
        {quest.reward.gold > 0 && <Badge variant="gold">+{quest.reward.gold} Gold</Badge>}
        {quest.reward.stats && Object.entries(quest.reward.stats).map(([stat, val]) => (
          val ? <Badge key={stat} variant="stat">+{val} {stat.toUpperCase()}</Badge> : null
        ))}
      </div>

      {(quest.deadline || quest.repeatable || quest.recurring || quest.repeatIntervalDays) && quest.status !== 'completed' && (
        <p className="font-mono text-[10px] text-outline mb-2">
          {quest.deadline ? (() => {
            const days = daysRemaining(quest.deadline);
            return days > 0 ? `⏱ ${days}d left` : '⏱ Overdue';
          })() : ''}
          {quest.deadline && (quest.repeatable || quest.recurring || quest.repeatIntervalDays) ? ' · ' : ''}
          {quest.recurring ? '☀ Daily' : quest.repeatable ? '🔄 Repeatable' : quest.repeatIntervalDays ? `🔁 Every ${quest.repeatIntervalDays}d` : ''}
        </p>
      )}

      <div className="flex justify-end">
        {quest.status === 'not_started' && (
          <Button size="sm" variant="ghost" onClick={() => startQuest(quest.id)}>
            ○ Start
          </Button>
        )}
        {quest.status === 'in_progress' && (
          <Button size="sm" variant="primary" onClick={() => completeQuest(quest.id)}>
            ✓ Finish
          </Button>
        )}
        {quest.status === 'completed' && (
          <span className="font-mono text-xs text-primary flex items-center gap-1">
            ✓✓ Completed
          </span>
        )}
      </div>
    </Card>
  );
}
