import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { CALENDAR_SCOPE, googleAvailable, googleSignOut, rememberGoogleToken } from './google';
import { useSettings } from './settings';
import { storage } from './storage';
import { supabase } from './supabase';

export interface Account {
  id: string;
  email: string | null;
  name: string | null;
  provider: 'google' | string;
}

interface AuthContextValue {
  ready: boolean;
  account: Account | null;
  /** Chose "Continue as guest" on the welcome screen. */
  guest: boolean;
  /** Supabase keys are set, so accounts work. */
  configured: boolean;
  googleReady: boolean;
  /** Redirects to Google; the session arrives when the page loads again. */
  signInWithGoogle: () => Promise<boolean>;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
}

const GUEST_KEY = 'leavy.guest';

const AuthContext = createContext<AuthContextValue | null>(null);

function requireSupabase() {
  if (!supabase) throw new Error('Accounts aren’t set up yet. Add the Supabase keys to .env.local (see README).');
  return supabase;
}

function toAccount(session: Session | null): Account | null {
  const u = session?.user;
  if (!u) return null;
  const meta = u.user_metadata ?? {};
  return {
    id: u.id,
    email: u.email ?? null,
    name: meta.full_name ?? meta.name ?? null,
    provider: u.app_metadata?.provider ?? 'email',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { update } = useSettings();
  const [session, setSession] = useState<Session | null>(null);
  const [guest, setGuest] = useState(() => storage.get(GUEST_KEY) === '1');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.resolve(supabase?.auth.getSession().then(({ data }) => setSession(data.session)))
      .catch(() => {})
      .finally(() => setReady(true));
    const sub = supabase?.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // After a browser sign-in, Supabase passes on Google's token; it reads the calendar too.
      if (s?.provider_token) {
        rememberGoogleToken(s.provider_token).then((calendar) => calendar && update({ googleCalendar: true, demoMode: false }));
      }
    });
    return () => sub?.data.subscription.unsubscribe();
  }, [update]);

  const signInWithGoogle = useCallback(async () => {
    const sb = requireSupabase();
    // Browsers sign in by redirecting to Google. The session arrives when Google sends the user
    // back, through detectSessionInUrl (supabase.ts) and onAuthStateChange above.
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { scopes: CALENDAR_SCOPE, redirectTo: `${window.location.origin}/` },
    });
    if (error) throw error;
    return true;
  }, []);

  const continueAsGuest = useCallback(() => {
    setGuest(true);
    storage.set(GUEST_KEY, '1');
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    await googleSignOut();
    update({ googleCalendar: false });
    setGuest(false);
    storage.remove(GUEST_KEY);
  }, [update]);

  const value = useMemo(
    () => ({
      ready,
      account: toAccount(session),
      guest,
      configured: supabase !== null,
      googleReady: googleAvailable(),
      signInWithGoogle,
      continueAsGuest,
      signOut,
    }),
    [ready, session, guest, signInWithGoogle, continueAsGuest, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
