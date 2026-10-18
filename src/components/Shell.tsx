import { Link2, Navigation, RefreshCw, SlidersHorizontal, User, type LucideIcon } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import { useNow } from '../hooks';
import { useAuth } from '../lib/auth';
import { countdownText } from '../lib/countdown';
import { formatTime } from '../lib/format';
import { timingFor } from '../lib/plan';
import { useSettings } from '../lib/settings';
import { useTrips } from '../lib/trips';
import { GoogleIcon } from './icons';
import { Logo, Spinner, StatusPill } from './ui';

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Upcoming', icon: Navigation },
  { to: '/connections', label: 'Connections', icon: Link2 },
  { to: '/preferences', label: 'Preferences', icon: SlidersHorizontal },
];

/** Press R anywhere outside a text field to refresh. */
function useRefreshShortcut(refresh: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'r' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return;
      e.preventDefault();
      refresh();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [refresh]);
}

/**
 * The signed-in app's frame. One nav element that CSS lays out as a sidebar on laptops,
 * an icon rail on tablets and a top bar with tabs on phones (styles.css → Shell).
 */
export function Shell({ children }: { children: ReactNode }) {
  const { refresh } = useTrips();
  const { pathname } = useLocation();
  useRefreshShortcut(refresh);
  const onUpcoming = pathname === '/' || pathname.startsWith('/trip');

  return (
    <div className="app">
      <nav className="nav" aria-label="Main">
        <div className="brand">
          <Logo size={36} />
          <span className="brand-name">Leavy</span>
          <span className="nav-refresh-compact">
            <RefreshButton />
          </span>
        </div>

        <div className="nav-links">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link ${isActive || (to === '/' && onUpcoming) ? 'active' : ''}`}
              aria-current={to === '/' && onUpcoming ? 'page' : undefined}
            >
              <Icon size={20} aria-hidden />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Upcoming already shows the next departure front and centre. */}
        {onUpcoming ? null : <NextUp />}

        <div className="nav-spacer" />
        <RefreshStatus />
        <AccountLink />
      </nav>
      <main className="main">{children}</main>
    </div>
  );
}

/** The next departure, visible from every other page. */
function NextUp() {
  const now = useNow();
  const { trips, loading } = useTrips();
  const { settings } = useSettings();
  const next = trips[0];
  if (loading || !next) return null;

  const timing = timingFor(next, now);
  const { lead, value } = countdownText(next, timing, settings.leaveTimeStyle);
  return (
    <div className="nav-extra" style={{ marginTop: 24 }}>
      <p className="t-overline muted" style={{ padding: '0 4px' }}>
        Next departure
      </p>
      <Link to={`/?trip=${encodeURIComponent(next.event.key)}`} className={`next-up status-${timing.status}`} aria-label={`${next.event.title}. ${lead} ${value}.`}>
        <StatusPill status={timing.status} />
        <p className="t-caption" style={{ marginTop: 8 }}>
          {lead}
        </p>
        <p style={{ fontSize: 24, lineHeight: '30px', fontWeight: 700 }} className="tabular ellipsis">
          {value}
        </p>
        <p className="t-caption ellipsis" style={{ color: 'var(--text)' }}>
          {next.event.title}
        </p>
      </Link>
    </div>
  );
}

function RefreshButton() {
  const { refresh, refreshing } = useTrips();
  return (
    <button type="button" className="icon-btn" onClick={refresh} disabled={refreshing} aria-label="Refresh" title="Refresh (R)">
      {refreshing ? <Spinner label="Refreshing" /> : <RefreshCw size={20} aria-hidden />}
    </button>
  );
}

function RefreshStatus() {
  const { updatedAt } = useTrips();
  return (
    <div className="nav-footer">
      <div className="grow nav-footer-text">
        <p className="t-caption muted">{updatedAt ? `Updated ${formatTime(updatedAt)}` : 'Loading…'}</p>
        <p className="t-caption muted" style={{ fontSize: 12 }}>
          Press R to refresh
        </p>
      </div>
      <RefreshButton />
    </div>
  );
}

function AccountLink() {
  const { account } = useAuth();
  return (
    <Link to="/connections" className="account-link">
      <span className="avatar">{account?.provider === 'google' ? <GoogleIcon size={16} /> : <User size={16} aria-hidden />}</span>
      <span className="grow">
        <span className="t-strong ellipsis" style={{ display: 'block', fontSize: 14 }}>
          {account ? (account.name ?? account.email ?? 'Signed in') : 'Guest'}
        </span>
        <span className="t-caption muted ellipsis" style={{ display: 'block', fontSize: 12 }}>
          {account ? 'Settings saved to your account' : 'Sign in to sync settings'}
        </span>
      </span>
    </Link>
  );
}
