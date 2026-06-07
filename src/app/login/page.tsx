'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const { login, signup, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-surface">
        <p className="font-display text-primary text-lg animate-pulse">Loading QuestLog...</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const err = isSignup
      ? await signup(email, password)
      : await login(email, password);

    setSubmitting(false);

    if (err) {
      setError(err);
    } else {
      router.replace('/');
    }
  }

  return (
    <div className="flex items-center justify-center min-h-dvh bg-surface p-4">
      <div className="border-2 border-outline-variant bg-surface-container shadow-lg w-full max-w-sm">
        <div className="bg-primary px-6 py-4">
          <h1 className="font-display text-on-primary text-lg uppercase tracking-wider text-center">
            QuestLog
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="font-display text-sm text-on-surface-variant uppercase tracking-wider text-center mb-2">
            {isSignup ? 'Create Account' : 'Login'}
          </p>

          <Input
            label="Email"
            type="email"
            placeholder="hero@questlog.app"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="border-2 border-error bg-error-container px-3 py-2">
              <p className="font-mono text-xs text-error">{error}</p>
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
            {submitting ? 'Loading...' : isSignup ? 'Create Account' : 'Login'}
          </Button>

          <button
            type="button"
            onClick={() => { setIsSignup(!isSignup); setError(null); }}
            className="w-full text-center font-mono text-xs text-on-surface-variant hover:text-primary cursor-pointer py-1"
          >
            {isSignup ? 'Already have an account? Login' : 'Need an account? Sign up'}
          </button>
        </form>
      </div>
    </div>
  );
}
