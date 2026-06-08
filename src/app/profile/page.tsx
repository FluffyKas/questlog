'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useGameState } from '@/components/providers/GameProvider';
import { useTheme, type ThemeId } from '@/components/providers/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

const themes: { id: ThemeId; label: string; color: string }[] = [
  { id: 'dungeon', label: 'Dungeon', color: '#5be990' },
  { id: 'cyber-sunset', label: 'Cyber Sunset', color: '#ffabf3' },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { state, dispatch, userId } = useGameState();
  const { theme, setTheme } = useTheme();

  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      <h1 className="font-display text-xl uppercase tracking-wider mb-6">
        <span className="text-primary">⚙</span> Account
      </h1>

      <div className="border-2 border-outline-variant bg-surface-container shadow-md p-6 mb-6">
        <h3 className="font-display text-sm uppercase tracking-wider text-on-surface-variant mb-4">
          Details
        </h3>
        <p className="font-mono text-xs text-outline">{user?.email}</p>
      </div>

      {/* Theme */}
      <div className="border-2 border-outline-variant bg-surface-container shadow-md p-6 mb-6">
        <h3 className="font-display text-sm uppercase tracking-wider text-on-surface-variant mb-4">
          Theme
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`
                flex items-center gap-3 px-4 py-3 cursor-pointer
                border-2 transition-colors
                ${theme === t.id
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-outline-variant text-on-surface-variant hover:bg-surface-high'
                }
              `}
            >
              <span
                className="w-4 h-4 border-2 border-outline-variant"
                style={{ backgroundColor: t.color }}
              />
              <span className="font-display text-xs uppercase tracking-wider">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div className="border-2 border-outline-variant bg-surface-container shadow-md p-6 mb-6">
        <h3 className="font-display text-sm uppercase tracking-wider text-on-surface-variant mb-4">
          Change Password
        </h3>
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

      {/* Danger Zone */}
      <div className="border-2 border-outline-variant bg-surface-container shadow-md p-6 mb-6">
        <h3 className="font-display text-sm uppercase tracking-wider text-on-surface-variant mb-4">
          Danger Zone
        </h3>
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

      {/* Logout */}
      <button
        onClick={() => logout()}
        className="w-full px-4 py-3 font-display text-xs uppercase tracking-wider
          text-center text-outline hover:text-on-surface-variant cursor-pointer
          border-2 border-outline-variant hover:bg-surface-high transition-colors"
      >
        Logout
      </button>
    </div>
  );
}
