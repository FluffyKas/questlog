'use client';

import { type Quest } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useQuests, useGameState } from '@/components/providers/GameProvider';
import { QUEST_TYPE_CONFIG, QUEST_CATEGORY_CONFIG } from '@/lib/constants';
import { daysRemaining } from '@/lib/quest-engine';

interface QuestCardProps {
  quest: Quest;
}

const typeToRibbon: Record<string, 'primary' | 'secondary' | 'tertiary'> = {
  epic: 'primary',
  normal: 'secondary',
};

export function QuestCard({ quest }: QuestCardProps) {
  const { startQuest, completeQuest, quests } = useQuests();
  const { state } = useGameState();
  const completionCounts = state.questCompletionCounts ?? {};
  const config = QUEST_TYPE_CONFIG[quest.type] ?? QUEST_TYPE_CONFIG.normal;
  const hasRequirements = quest.type === 'epic' && quest.requirements && quest.requirements.length > 0;

  return (
    <Card
      ribbonTitle={config.label}
      ribbonVariant={typeToRibbon[quest.type] ?? 'secondary'}
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

      {hasRequirements && quest.status !== 'completed' && (
        <div className="space-y-2 mb-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
            Requirements
          </p>
          {quest.requirements!.map(req => {
            const subQuest = quests.find(q => q.id === req.questId);
            const current = Math.min(completionCounts[req.questId] ?? 0, req.count);
            return (
              <div key={req.questId}>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-body text-xs text-on-surface-variant truncate">
                    {subQuest?.title ?? 'Unknown Quest'}
                  </span>
                  <span className="font-mono text-[10px] text-outline ml-2 shrink-0">
                    {current}/{req.count}
                  </span>
                </div>
                <ProgressBar
                  value={current}
                  max={req.count}
                  segments={Math.min(req.count, 20)}
                  color="xp"
                  size="sm"
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end">
        {hasRequirements ? (
          quest.status === 'completed' ? (
            <span className="font-mono text-xs text-primary flex items-center gap-1">
              ✓✓ Epic Complete
            </span>
          ) : (
            <span className="font-mono text-[10px] text-outline">
              Auto-completes when requirements are met
            </span>
          )
        ) : (
          <>
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
          </>
        )}
      </div>
    </Card>
  );
}
