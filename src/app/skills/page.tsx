'use client';

import { useState } from 'react';
import { type QuestCategory, type SkillNode, type SkillNodeId, type SkillTreeState } from '@/lib/types';
import { useSkillTree } from '@/components/providers/GameProvider';
import { getNodesByBranch, QUEST_CATEGORY_CONFIG } from '@/lib/constants';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const BRANCHES: QuestCategory[] = ['mind', 'body', 'hearth'];

const BRANCH_COLORS: Record<QuestCategory, {
  text: string;
  border: string;
  bg: string;
  glow: string;
  bar: 'info' | 'error' | 'mana';
}> = {
  mind: { text: 'text-info', border: 'border-info', bg: 'bg-info/20', glow: 'glow-mind', bar: 'info' },
  body: { text: 'text-error', border: 'border-error', bg: 'bg-error/20', glow: 'glow-body', bar: 'error' },
  hearth: { text: 'text-mana', border: 'border-mana', bg: 'bg-mana/20', glow: 'glow-hearth', bar: 'mana' },
};

const SPECIALIZATIONS: Record<string, { a: string; b: string }> = {
  mind_fork: { a: 'Scholar', b: 'Creator' },
  body_fork: { a: 'Warrior', b: 'Ranger' },
  hearth_fork: { a: 'Steward', b: 'Artisan' },
};

function getNextThreshold(nodes: SkillNode[], unlockedNodes: SkillNodeId[]): number {
  for (const node of nodes) {
    if (!unlockedNodes.includes(node.id)) return node.requiredBranchXp;
  }
  return nodes[nodes.length - 1]?.requiredBranchXp ?? 0;
}

export default function SkillTreePage() {
  const { skillTree, unlockNode, canUnlock, isUnlocked, isForkLocked } = useSkillTree();
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [activeTab, setActiveTab] = useState<QuestCategory>('mind');

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="font-display text-lg text-primary mb-6">Skill Tree</h1>

      <div className="flex gap-1 mb-6 md:hidden">
        {BRANCHES.map(branch => (
          <button
            key={branch}
            onClick={() => setActiveTab(branch)}
            className={`flex-1 py-2 font-display text-xs uppercase tracking-wider border-2 transition-colors cursor-pointer
              ${activeTab === branch
                ? `${BRANCH_COLORS[branch].bg} ${BRANCH_COLORS[branch].text} ${BRANCH_COLORS[branch].border}`
                : 'bg-surface-container text-on-surface-variant border-outline-variant'
              }`}
          >
            {QUEST_CATEGORY_CONFIG[branch].icon} {QUEST_CATEGORY_CONFIG[branch].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {BRANCHES.map(branch => (
          <BranchColumn
            key={branch}
            branch={branch}
            skillTree={skillTree}
            isUnlocked={isUnlocked}
            canUnlock={canUnlock}
            onSelectNode={setSelectedNode}
            className={`${activeTab !== branch ? 'hidden md:flex' : 'flex'}`}
          />
        ))}
      </div>

      {selectedNode && (
        <NodeModal
          node={selectedNode}
          isUnlocked={isUnlocked(selectedNode.id)}
          canUnlock={canUnlock(selectedNode)}
          isForkLocked={false}
          branchXp={skillTree.branchXp[selectedNode.branch]}
          onUnlock={() => {
            unlockNode(selectedNode.id);
            setSelectedNode(null);
          }}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}

function BranchColumn({
  branch,
  skillTree,
  isUnlocked,
  canUnlock,
  onSelectNode,
  className = '',
}: {
  branch: QuestCategory;
  skillTree: SkillTreeState;
  isUnlocked: (id: SkillNodeId) => boolean;
  canUnlock: (node: SkillNode) => boolean;
  onSelectNode: (node: SkillNode) => void;
  className?: string;
}) {
  const colors = BRANCH_COLORS[branch];
  const config = QUEST_CATEGORY_CONFIG[branch];
  const allNodes = getNodesByBranch(branch);
  const sharedNodes = allNodes.filter(n => !n.forkGroup);
  const forkGroup = `${branch}_fork`;
  const forkA = allNodes.filter(n => n.forkGroup === forkGroup && (n.id.includes('scholar') || n.id.includes('warrior') || n.id.includes('steward')));
  const forkB = allNodes.filter(n => n.forkGroup === forkGroup && (n.id.includes('creator') || n.id.includes('ranger') || n.id.includes('artisan')));
  const specNames = SPECIALIZATIONS[forkGroup];

  const branchXp = skillTree.branchXp[branch];
  const nextThreshold = getNextThreshold(allNodes, skillTree.unlockedNodes);
  const allUnlocked = allNodes.every(n => isUnlocked(n.id));

  return (
    <div className={`flex-col items-center ${className}`}>
      <div className="w-full border-2 border-outline-variant bg-surface-container p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{config.icon}</span>
          <h2 className={`font-display text-sm uppercase tracking-wider ${colors.text}`}>
            {config.label}
          </h2>
        </div>
        <ProgressBar
          value={branchXp}
          max={allUnlocked ? branchXp : nextThreshold}
          color={colors.bar}
          segments={10}
          size="sm"
          showValue
          label="Branch XP"
        />
      </div>

      <div className="flex flex-col items-center gap-0">
        {sharedNodes.map((node, i) => (
          <div key={node.id} className="flex flex-col items-center">
            {i > 0 && <Connector unlocked={isUnlocked(node.id)} branch={branch} />}
            <NodeBox
              node={node}
              unlocked={isUnlocked(node.id)}
              available={canUnlock(node)}
              forkLocked={false}
              branch={branch}
              onClick={() => onSelectNode(node)}
            />
          </div>
        ))}

        <ForkConnector
          branch={branch}
          leftUnlocked={forkA.length > 0 && isUnlocked(forkA[0].id)}
          rightUnlocked={forkB.length > 0 && isUnlocked(forkB[0].id)}
        />

        <div className="flex gap-4 w-full">
          <div className="flex-1 flex flex-col items-center">
            <span className={`font-mono text-[10px] uppercase tracking-wider mb-2 ${
              forkA.some(n => isUnlocked(n.id)) ? colors.text : 'text-on-surface-variant'
            }`}>
              {specNames.a}
            </span>
            {forkA.map((node, i) => (
              <div key={node.id} className="flex flex-col items-center">
                {i > 0 && <Connector unlocked={isUnlocked(node.id)} branch={branch} />}
                <NodeBox
                  node={node}
                  unlocked={isUnlocked(node.id)}
                  available={canUnlock(node)}
                  forkLocked={false}
                  branch={branch}
                  onClick={() => onSelectNode(node)}
                />
              </div>
            ))}
          </div>

          <div className="flex-1 flex flex-col items-center">
            <span className={`font-mono text-[10px] uppercase tracking-wider mb-2 ${
              forkB.some(n => isUnlocked(n.id)) ? colors.text : 'text-on-surface-variant'
            }`}>
              {specNames.b}
            </span>
            {forkB.map((node, i) => (
              <div key={node.id} className="flex flex-col items-center">
                {i > 0 && <Connector unlocked={isUnlocked(node.id)} branch={branch} />}
                <NodeBox
                  node={node}
                  unlocked={isUnlocked(node.id)}
                  available={canUnlock(node)}
                  forkLocked={false}
                  branch={branch}
                  onClick={() => onSelectNode(node)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NodeBox({
  node,
  unlocked,
  available,
  forkLocked,
  branch,
  onClick,
}: {
  node: SkillNode;
  unlocked: boolean;
  available: boolean;
  forkLocked: boolean;
  branch: QuestCategory;
  onClick: () => void;
}) {
  const colors = BRANCH_COLORS[branch];

  let stateClasses = '';
  if (forkLocked) {
    stateClasses = 'border-outline-variant bg-surface-high opacity-30 cursor-not-allowed';
  } else if (unlocked) {
    stateClasses = `${colors.border} ${colors.bg} ${colors.glow} cursor-pointer`;
  } else if (available) {
    stateClasses = `border-outline bg-surface-container cursor-pointer animate-pulse-border`;
  } else {
    stateClasses = 'border-outline-variant bg-surface-high opacity-60 cursor-default';
  }

  return (
    <button
      onClick={onClick}
      disabled={forkLocked}
      className={`
        w-20 h-20 flex flex-col items-center justify-center gap-1
        border-2 transition-all duration-200
        ${stateClasses}
      `}
    >
      <span className="text-xl">{node.icon}</span>
      <span className={`font-mono text-[9px] leading-tight text-center px-1 ${
        unlocked ? colors.text : 'text-on-surface-variant'
      }`}>
        {node.name}
      </span>
    </button>
  );
}

function Connector({ unlocked, branch }: { unlocked: boolean; branch: QuestCategory }) {
  const colors = BRANCH_COLORS[branch];
  return (
    <div className={`w-[2px] h-6 ${unlocked ? colors.bg : 'bg-outline-variant'}`} />
  );
}

function ForkConnector({
  branch,
  leftUnlocked,
  rightUnlocked,
}: {
  branch: QuestCategory;
  leftUnlocked: boolean;
  rightUnlocked: boolean;
}) {
  const colors = BRANCH_COLORS[branch];
  const anyUnlocked = leftUnlocked || rightUnlocked;

  return (
    <div className="relative w-full h-8 my-1">
      <div className={`absolute left-1/2 top-0 w-[2px] h-3 -translate-x-1/2 ${
        anyUnlocked ? colors.bg : 'bg-outline-variant'
      }`} />
      <div className={`absolute top-3 left-1/4 right-1/4 h-[2px] ${
        anyUnlocked ? colors.bg : 'bg-outline-variant'
      }`} />
      <div className={`absolute left-1/4 top-3 w-[2px] h-5 ${
        leftUnlocked ? colors.bg : 'bg-outline-variant'
      }`} />
      <div className={`absolute right-1/4 top-3 w-[2px] h-5 ${
        rightUnlocked ? colors.bg : 'bg-outline-variant'
      }`} />
    </div>
  );
}

function NodeModal({
  node,
  isUnlocked,
  canUnlock,
  isForkLocked,
  branchXp,
  onUnlock,
  onClose,
}: {
  node: SkillNode;
  isUnlocked: boolean;
  canUnlock: boolean;
  isForkLocked: boolean;
  branchXp: number;
  onUnlock: () => void;
  onClose: () => void;
}) {
  const colors = BRANCH_COLORS[node.branch];
  const config = QUEST_CATEGORY_CONFIG[node.branch];

  return (
    <Modal isOpen onClose={onClose} title={node.name}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 flex items-center justify-center border-2 text-2xl ${
            isUnlocked ? `${colors.border} ${colors.bg}` : 'border-outline-variant bg-surface-high'
          }`}>
            {node.icon}
          </div>
          <div>
            <p className={`font-display text-xs uppercase ${colors.text}`}>
              {config.icon} {config.label} Branch
            </p>
            <p className="font-body text-sm text-on-surface mt-1">{node.description}</p>
          </div>
        </div>

        <div className="border-t-2 border-outline-variant pt-3">
          <div className="flex justify-between font-mono text-xs text-on-surface-variant">
            <span>Required Branch XP</span>
            <span className={branchXp >= node.requiredBranchXp ? 'text-primary' : 'text-warning'}>
              {branchXp} / {node.requiredBranchXp}
            </span>
          </div>
          <ProgressBar
            value={branchXp}
            max={node.requiredBranchXp}
            color={colors.bar}
            segments={10}
            size="sm"
            className="mt-2"
          />
        </div>

        {isForkLocked && (
          <p className="font-mono text-xs text-warning">
            This path is locked. You chose a different specialization.
          </p>
        )}

        {isUnlocked && (
          <p className="font-mono text-xs text-primary">
            ✓ Unlocked
          </p>
        )}

        {!isUnlocked && !isForkLocked && (
          <Button
            variant="primary"
            onClick={onUnlock}
            disabled={!canUnlock}
            className="w-full"
          >
            {canUnlock ? 'Unlock Skill' : 'Requirements not met'}
          </Button>
        )}
      </div>
    </Modal>
  );
}
