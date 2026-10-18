
// Google in the browser. Calendar access comes from Google Identity Services' token
// popup (works for guests too), or from the token Supabase hands over after a Google sign-in.
// Browsers get a one-hour access token with no refresh token, so after that the user reconnects.

export interface GoogleResult {
  idToken: string | null;
  email: string;
  name: string | null;
  /** Whether the user allowed calendar access. Google lets them untick it on the consent screen. */
  calendar: boolean;
}

export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

const webClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID;
/** On once the Web client ID is set. The site's address must also be allowed in Google Cloud and Supabase (docs/SETUP.md). */
const enabled = !!webClientId;

const TOKEN_KEY = 'leavy.google.token';
const SEEN_KEY = 'leavy.google.seen';

interface StoredToken {
  token: string;
  expiresAt: number;
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number | string;
  error?: string;
  error_description?: string;
}

interface OAuth2 {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    prompt?: string;
    callback: (r: TokenResponse) => void;
    error_callback?: (e: { type: string }) => void;
  }): { requestAccessToken(): void };
  hasGrantedAllScopes(r: TokenResponse, scope: string): boolean;
}

declare global {
  interface Window {
    google?: { accounts?: { oauth2?: OAuth2 } };
  }
}

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readToken(): StoredToken | null {
  try {
    const raw = storage()?.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as StoredToken) : null;
  } catch {
    return null;
  }
}

function saveToken(token: string, expiresInSec: number) {
  storage()?.setItem(TOKEN_KEY, JSON.stringify({ token, expiresAt: Date.now() + expiresInSec * 1000 }));
}

let gis: Promise<OAuth2> | null = null;

/** Loads Google's script once. Started early so the popup opens straight from the click. */
function loadGis(): Promise<OAuth2> {
  gis ??= new Promise<OAuth2>((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve(window.google.accounts.oauth2);
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => (window.google?.accounts?.oauth2 ? resolve(window.google.accounts.oauth2) : reject(new Error('Google sign-in didn’t load.')));
    script.onerror = () => reject(new Error('Couldn’t load Google sign-in. Check your connection.'));
    document.head.appendChild(script);
  }).catch((e) => {
    gis = null;
    throw e;
  });
  return gis;
}

if (enabled && typeof document !== 'undefined') loadGis().catch(() => {});

export function googleAvailable(): boolean {
  return enabled;
}

/** Opens Google's popup asking for calendar access. Resolves null if the user closes it. */
export async function googleSignIn(): Promise<GoogleResult | null> {
  if (!enabled || !webClientId) throw new Error('Google isn’t set up yet. Add VITE_GOOGLE_WEB_CLIENT_ID to .env.local (see docs/SETUP.md).');
  const oauth2 = await loadGis();
  return new Promise((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: webClientId,
      scope: CALENDAR_SCOPE,
      // Empty prompt: skip the consent screen when the user already agreed.
      prompt: '',
      callback: (r) => {
        if (r.error || !r.access_token) {
          if (r.error === 'access_denied') resolve(null);
          else reject(new Error(r.error_description ?? 'Google didn’t allow calendar access.'));
          return;
        }
        const calendar = oauth2.hasGrantedAllScopes(r, CALENDAR_SCOPE);
        if (calendar) saveToken(r.access_token, Number(r.expires_in) || 3600);
        resolve({ idToken: null, email: '', name: null, calendar });
      },
      error_callback: (e) => {
        if (e.type === 'popup_closed') resolve(null);
        else if (e.type === 'popup_failed_to_open') reject(new Error('Your browser blocked Google’s window. Allow pop-ups for this site and try again.'));
        else reject(new Error('Couldn’t open Google sign-in.'));
      },
    });
    client.requestAccessToken();
  });
}

/**
 * Keeps the Google token Supabase returns after a Google sign-in, if it includes calendar access.
 * Resolves true only for a token it hasn't seen before, so a page reload doesn't turn
 * Google Calendar back on after the user disconnected it.
 */
export async function rememberGoogleToken(token: string): Promise<boolean> {
  const store = storage();
  if (!enabled || !store || store.getItem(SEEN_KEY) === token) return false;
  store.setItem(SEEN_KEY, token);
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`);
    if (!res.ok) return false;
    const info: { scope?: string; expires_in?: string } = await res.json();
    if (!info.scope?.split(' ').includes(CALENDAR_SCOPE)) return false;
    saveToken(token, Number(info.expires_in) || 3600);
    return true;
  } catch {
    return false;
  }
}

let pendingToken: Promise<string> | null = null;

/** Same contract as on phones: concurrent callers share one lookup. */
export function googleAccessToken(): Promise<string> {
  pendingToken ??= (async () => {
    const stored = readToken();
    // A minute of margin so a token doesn't expire mid-refresh.
    if (stored && stored.expiresAt - 60_000 > Date.now()) return stored.token;
    throw new Error('Google Calendar needs reconnecting. Browsers only keep access for an hour; choose Reconnect in Connections.');
  })().finally(() => {
    pendingToken = null;
  });
  return pendingToken;
}

/** Drops a token Google rejected, so the next call asks the user to reconnect. */
export async function forgetGoogleToken(token: string) {
  if (readToken()?.token === token) storage()?.removeItem(TOKEN_KEY);
}

export async function googleSignOut() {
  storage()?.removeItem(TOKEN_KEY);
}
