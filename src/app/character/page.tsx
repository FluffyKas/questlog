'use client';

import { useState } from 'react';
import { useHero, useGameState, useAchievements } from '@/components/providers/GameProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { STAT_LABELS } from '@/lib/constants';
import { type StatName } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export default function CharacterPage() {
  const { hero, xpPercent, xpIntoCurrentLevel, xpForCurrentLevel, hpPercent } = useHero();
  const { state, dispatch, userId } = useGameState();
  const { user } = useAuth();
  const { unlockedTitles, setTitle } = useAchievements();

  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const totalCompleted = state.quests.filter(q => q.status === 'completed').length;

  const statColors: Record<StatName, string> = {
    str: 'text-error',
    int: 'text-info',
    wis: 'text-mana',
    dex: 'text-gold',
    cha: 'text-hp',
    con: 'text-xp',
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl">
      <h1 className="font-display text-xl uppercase tracking-wider mb-6">
        <span className="text-primary">👤</span> Character Sheet
      </h1>

      {/* Hero Card */}
      <div className="border-2 border-outline-variant bg-surface-container shadow-md p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-24 h-24 bevel bg-surface-high flex items-center justify-center text-5xl">
            ⚔
          </div>
          <div>
            <h2 className="font-display text-lg text-primary">{hero.name}</h2>
            <p className="font-mono text-sm text-on-surface-variant">Level {hero.level}</p>
            {hero.title && (
              <p className="font-mono text-xs text-gold italic">{hero.title}</p>
            )}
            {unlockedTitles.length > 0 && (
              <select
                value={hero.title || ''}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 bg-surface-high border-2 border-outline-variant px-2 py-1 font-mono text-xs text-on-surface-variant cursor-pointer"
              >
                <option value="">No title</option>
                {unlockedTitles.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <ProgressBar
          label="Health Points (HP)"
          value={hero.hp}
          max={hero.maxHp}
          color="hp"
          showValue
          size="md"
          className="mb-4"
        />
        <ProgressBar
          label="Experience (XP)"
          value={xpIntoCurrentLevel}
          max={xpForCurrentLevel}
          color="xp"
          showValue
          size="md"
        />
      </div>

      {/* Stats */}
      <div className="border-2 border-outline-variant bg-surface-container shadow-md p-6 mb-6">
        <h3 className="font-display text-sm uppercase tracking-wider text-on-surface-variant mb-4">
          Attributes
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(Object.entries(hero.stats) as [StatName, number][]).map(([stat, value]) => (
            <div key={stat} className="bevel bg-surface-high p-3 text-center">
              <p className="font-mono text-[10px] uppercase text-on-surface-variant mb-1">
                {STAT_LABELS[stat]}
              </p>
              <p className={`font-display text-2xl ${statColors[stat]}`}>
                {value}
              </p>
              <p className="font-mono text-[10px] uppercase text-outline mt-1">
                {stat.toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="border-2 border-outline-variant bg-surface-container shadow-md p-6 mb-6">
        <h3 className="font-display text-sm uppercase tracking-wider text-on-surface-variant mb-4">
          Adventure Stats
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="font-display text-2xl text-primary">{totalCompleted}</p>
            <p className="font-mono text-[10px] uppercase text-on-surface-variant">Quests Completed</p>
          </div>
          <div className="text-center">
            <p className="font-display text-2xl text-gold">{hero.gold.toLocaleString()}</p>
            <p className="font-mono text-[10px] uppercase text-on-surface-variant">Gold Earned</p>
          </div>
          <div className="text-center">
            <p className="font-display text-2xl text-xp">{hero.xp.toLocaleString()}</p>
            <p className="font-mono text-[10px] uppercase text-on-surface-variant">Total XP</p>
          </div>
          <div className="text-center">
            <p className="font-display text-2xl text-mana">{state.streak.longest}</p>
            <p className="font-mono text-[10px] uppercase text-on-surface-variant">Best Streak</p>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="border-2 border-outline-variant bg-surface-container shadow-md p-6">
        <h3 className="font-display text-sm uppercase tracking-wider text-on-surface-variant mb-4">
          Account
        </h3>

        <p className="font-mono text-xs text-outline mb-4">{user?.email}</p>

        {/* Change Password */}
        <div className="mb-6">
          <label className="font-mono text-xs uppercase text-on-surface-variant block mb-2">
            Change Password
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="flex-1 px-3 py-2 bg-surface-lowest border-2 border-outline-variant
                font-body text-sm text-on-surface placeholder:text-outline
                focus:outline-none focus:border-primary"
            />
            <Button
              size="sm"
              variant="ghost"
              disabled={changingPassword || newPassword.length < 6}
              onClick={async () => {
                setChangingPassword(true);
                setPasswordMsg(null);
                const { error } = await supabase.auth.updateUser({ password: newPassword });
                if (error) {
                  setPasswordMsg({ text: error.message, error: true });
                } else {
                  setPasswordMsg({ text: 'Password updated!', error: false });
                  setNewPassword('');
                }
                setChangingPassword(false);
              }}
            >
              {changingPassword ? '...' : 'Update'}
            </Button>
          </div>
          {passwordMsg && (
            <p className={`font-mono text-[10px] mt-1 ${passwordMsg.error ? 'text-error' : 'text-xp'}`}>
              {passwordMsg.text}
            </p>
          )}
        </div>

        {/* Reset Profile */}
        <div className="border-t-2 border-outline-variant pt-4">
          <label className="font-mono text-xs uppercase text-on-surface-variant block mb-2">
            Danger Zone
          </label>
          {!confirmReset ? (
            <Button size="sm" variant="ghost" onClick={() => setConfirmReset(true)}>
              Reset Profile
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="font-body text-xs text-error">
                This will reset your hero, stats, achievements, streak, and all quest progress back to zero. Quest definitions will be kept. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  disabled={resetting}
                  onClick={async () => {
                    setResetting(true);
                    await supabase.from('quest_progress').delete().eq('user_id', userId);

                    const { initializeGameState, loadQuestsFromSupabase } = await import('@/lib/storage');
                    const fresh = initializeGameState();
                    const quests = await loadQuestsFromSupabase(userId);
                    dispatch({ type: 'RESET_PROFILE', state: { ...fresh, quests } });

                    setConfirmReset(false);
                    setResetting(false);
                  }}
                >
                  {resetting ? 'Resetting...' : 'Confirm Reset'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
