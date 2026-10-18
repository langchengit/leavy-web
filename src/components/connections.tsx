import { ChevronDown, CircleAlert, CircleCheck, Cloud, Lock, LogOut, Plus, Trash2, User } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { useAuth } from '../lib/auth';
import { googleSignIn } from '../lib/google';
import { feedLabel, fetchFeedEvents, forgetFeed, maskFeedUrl, normalizeFeedUrl } from '../lib/icsFeed';
import { hasApiKey } from '../lib/routes';
import { useSettings } from '../lib/settings';
import { useTrips } from '../lib/trips';
import { GoogleIcon } from './icons';
import { Button, Card, LinkButton, Spinner, SwitchRow } from './ui';

/** "Continue with Google", with its own busy and error states. Hidden until Google is set up for the site. */
export function SignInButtons() {
  const { configured, googleReady, signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!configured || !googleReady) {
    return (
      <p className="t-caption muted center">
        {!configured
          ? 'Accounts aren’t set up yet. Add the Supabase keys to .env.local (see README).'
          : 'Google sign-in isn’t set up yet. Add VITE_GOOGLE_WEB_CLIENT_ID to .env.local (see docs/SETUP.md). You can still continue as a guest.'}
      </p>
    );
  }

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed. Try again.');
      setBusy(false);
    }
    // On success the browser is leaving for Google, so stay busy.
  };

  return (
    <div className="stack g-md">
      <button type="button" className="btn google-btn" onClick={run} disabled={busy}>
        {busy ? <Spinner label="Signing in" /> : <GoogleIcon />}
        Continue with Google
      </button>
      {error ? (
        <p role="alert" className="t-caption error-text center">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Connections → Account: who's signed in, or the sign-in button for guests. */
export function AccountCard() {
  const { account, guest, signOut } = useAuth();

  if (!account) {
    return (
      <Card className="stack g-md">
        <p className="muted">Sign in to load your calendar automatically and use the same settings here and in the phone app.</p>
        <SignInButtons />
        {guest ? (
          <div className="row" style={{ justifyContent: 'center' }}>
            {/* signOut also clears guest mode, which brings back the welcome screen. */}
            <LinkButton label="Back to the welcome screen" onClick={() => signOut()} />
          </div>
        ) : null}
      </Card>
    );
  }

  const confirmSignOut = () => {
    if (window.confirm('Sign out of Leavy?\nGoogle Calendar will be disconnected in this browser. Your saved settings stay in your account.')) signOut();
  };

  return (
    <Card className="stack g-md">
      <div className="row g-md">
        {account.provider === 'google' ? <GoogleIcon size={24} /> : <User size={24} aria-hidden />}
        <div className="stack g-xs grow">
          <p className="t-strong ellipsis">{account.name ?? account.email ?? 'Signed in'}</p>
          <p className="t-caption muted ellipsis">
            {account.name && account.email ? `${account.email} · ` : ''}
            {account.provider === 'google' ? 'Google' : account.provider}
          </p>
        </div>
      </div>
      <p className="t-caption muted">Your settings are saved to your account.</p>
      <Button variant="secondary" icon={LogOut} label="Sign out" onClick={confirmSignOut} />
    </Card>
  );
}

/** Connections → Connected calendars: Google Calendar. */
export function ConnectedCalendars() {
  const { googleReady } = useAuth();
  const { settings, update } = useSettings();
  const { googleError } = useTrips();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await googleSignIn();
      if (!res) return;
      if (res.calendar) update({ googleCalendar: true, demoMode: false });
      else setError('Calendar access wasn’t allowed. Try again and tick the calendar box on Google’s screen.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t connect Google Calendar.');
    } finally {
      setBusy(false);
    }
  };

  const ok = settings.googleCalendar && !googleError;
  const warn = settings.googleCalendar && !!googleError;
  const status = settings.googleCalendar
    ? (googleError ?? 'Connected. Shows the calendars ticked in Google Calendar.')
    : googleReady
      ? 'Not connected.'
      : 'Not set up yet. Add VITE_GOOGLE_WEB_CLIENT_ID to .env.local (see docs/SETUP.md).';

  return (
    <Card className="stack g-sm">
      <div className="row g-md">
        <GoogleIcon size={22} />
        <div className="stack g-xs grow">
          <p className="t-strong">Google Calendar</p>
          <p className={`t-caption ${warn ? 'error-text' : 'muted'}`}>{status}</p>
        </div>
        {ok ? <CircleCheck size={22} color="var(--primary)" aria-label="Connected" /> : null}
      </div>
      {busy ? (
        <div className="row" style={{ justifyContent: 'center', minHeight: 48 }}>
          <Spinner label="Connecting Google Calendar" />
        </div>
      ) : settings.googleCalendar ? (
        <div className="row g-xl" style={{ paddingLeft: 34 }}>
          {googleError ? <LinkButton label="Reconnect" onClick={connectGoogle} /> : null}
          <LinkButton label="Disconnect" onClick={() => update({ googleCalendar: false })} />
        </div>
      ) : googleReady ? (
        <Button icon={Plus} label="Connect Google Calendar" onClick={connectGoogle} />
      ) : null}
      {error ? (
        <p role="alert" className="t-caption error-text">
          {error}
        </p>
      ) : null}
    </Card>
  );
}

const GOOGLE_STEPS = [
  // Zero-width spaces let the long address wrap at its slashes.
  'Go to:\ncalendar.google.com/​calendar/​r/​settings',
  'In the menu on the left, scroll down to “Settings for my calendars”. It’s below General, Add calendar and Import & export.',
  'Under it, click your name. That’s your main calendar.',
  'On the right, scroll almost to the bottom to “Integrate calendar”.',
  'Copy “Secret address in iCal format” (it ends in /basic.ics) and paste it below.',
];

const ICLOUD_STEPS = [
  'On your iPhone, open the Calendar app.',
  'Tap Calendars at the bottom of the screen.',
  'Tap the ⓘ button next to the calendar you want.',
  'Turn on Public Calendar, then tap Share Link… → Copy.',
  'Send the link to this computer, for example in an email to yourself, and paste it below.',
];

/** Private iCal links (Google / iCloud / Outlook), loaded through the ics-proxy function. */
export function CalendarLinks() {
  const { settings, update } = useSettings();
  const { feedErrors } = useTrips();
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'ok'; text: string } | null>(null);

  const add = async () => {
    const url = normalizeFeedUrl(draft);
    if (!url) {
      setMessage({ tone: 'error', text: 'That doesn’t look like a link. It should start with https:// or webcal://.' });
      return;
    }
    if (settings.calendarFeeds.includes(url)) {
      setMessage({ tone: 'error', text: 'You’ve already added this calendar.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      // Load it once now so a bad link is caught here, not silently later.
      const now = Date.now();
      const events = await fetchFeedEvents(url, new Date(now), new Date(now + settings.lookAheadHours * 3_600_000));
      update({ calendarFeeds: [...settings.calendarFeeds, url], demoMode: false });
      setDraft('');
      setMessage({
        tone: 'ok',
        text: `Added ${feedLabel(url)}. ${events.length} event${events.length === 1 ? '' : 's'} in the next ${settings.lookAheadHours} hours.`,
      });
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof Error ? e.message : 'Couldn’t load that calendar.' });
    } finally {
      setBusy(false);
    }
  };

  const remove = (url: string) => {
    if (!window.confirm(`Remove ${feedLabel(url)}?\nYou’ll need to copy the link again to add it back.`)) return;
    forgetFeed(url);
    update({ calendarFeeds: settings.calendarFeeds.filter((u) => u !== url) });
    setMessage(null);
  };

  return (
    <Card className="stack g-md">
      <p className="muted">No account? Paste a private calendar link instead. Leavy loads it through its own server, because browsers block these links.</p>

      {settings.calendarFeeds.map((url) => (
        <div key={url} className="feed">
          {feedErrors[url] ? <CircleAlert size={22} color="var(--late-fg)" aria-label="Not loading" /> : <CircleCheck size={22} color="var(--primary)" aria-label="Loading" />}
          <div className="stack g-xs grow">
            <p className="t-strong">{feedLabel(url)}</p>
            <p className={`t-caption ${feedErrors[url] ? 'error-text' : 'muted'}`}>{feedErrors[url] ?? maskFeedUrl(url)}</p>
          </div>
          <button type="button" className="icon-btn danger" aria-label={`Remove ${feedLabel(url)}`} onClick={() => remove(url)}>
            <Trash2 size={20} aria-hidden />
          </button>
        </div>
      ))}

      <form
        className="stack g-sm"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <label className="stack g-sm">
          <span className="t-strong">Calendar link</span>
          <input
            className="input"
            type="url"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (message?.tone === 'error') setMessage(null);
            }}
            placeholder="https://calendar.google.com/…/basic.ics"
            autoComplete="off"
            spellCheck={false}
            disabled={busy}
            aria-invalid={message?.tone === 'error'}
          />
        </label>
        {message ? (
          <p role={message.tone === 'error' ? 'alert' : 'status'} className={`t-caption ${message.tone === 'error' ? 'error-text' : 'ok-text'}`}>
            {message.text}
          </p>
        ) : null}
        {busy ? (
          <div className="row g-sm" style={{ justifyContent: 'center', minHeight: 48 }}>
            <Spinner label="Checking the link" />
            <span className="t-caption muted">Checking the link…</span>
          </div>
        ) : (
          <button type="submit" className="btn btn-primary">
            <Plus size={20} aria-hidden />
            Add calendar
          </button>
        )}
      </form>

      <div className="stack g-xs">
        <p className="t-overline muted" style={{ marginTop: 8 }}>
          How to get your link
        </p>
        <HowTo title="Google Calendar" icon={<GoogleIcon />} steps={GOOGLE_STEPS}>
          Can’t find “Integrate calendar”? School and work accounts often have it turned off. Use a personal Gmail calendar or the iCloud steps instead. New events can
          take a few hours to show up.
        </HowTo>
        <HowTo title="iCloud Calendar" icon={<Cloud size={18} aria-hidden />} steps={ICLOUD_STEPS}>
          “Public” only means anyone with the link can see it. It isn’t listed or searchable anywhere.
        </HowTo>
        <div className="row g-sm muted" style={{ alignItems: 'flex-start', marginTop: 8 }}>
          <Lock size={16} aria-hidden style={{ marginTop: 2, flexShrink: 0 }} />
          <p className="t-caption">
            Treat these links like passwords: anyone with one can read that calendar. The app keeps them only in this browser, and the server that loads them doesn’t store
            them.
          </p>
        </div>
      </div>
    </Card>
  );
}

function HowTo({ title, icon, steps, children }: { title: string; icon: ReactNode; steps: string[]; children: ReactNode }) {
  return (
    <details className="howto">
      <summary>
        {icon}
        {title}
        <ChevronDown size={18} className="chev" aria-hidden />
      </summary>
      <ol>
        {steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
      <p className="t-caption muted" style={{ padding: '0 12px 12px' }}>
        {children}
      </p>
    </details>
  );
}

/** Connections → Demo. */
export function DemoModeSwitch() {
  const { settings, update } = useSettings();
  const { usingDemo } = useTrips();
  return (
    <SwitchRow
      label="Demo mode"
      helper={usingDemo && !settings.demoMode ? 'On automatically until you add a calendar.' : 'Use sample events and made-up travel times.'}
      value={settings.demoMode}
      onChange={(demoMode) => update({ demoMode })}
    />
  );
}

/** Connections → About: whether live travel times are available. */
export function MapsKeyStatus() {
  return (
    <div className="stack g-xs">
      <p className="t-strong">Google Maps</p>
      <p className="t-caption muted">{hasApiKey ? 'API key connected. Live traffic and transit schedules are on.' : 'No API key set. See the README for setup.'}</p>
    </div>
  );
}
