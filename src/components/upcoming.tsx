import { BellOff, ChevronRight, CircleAlert, Clock, FlaskConical, KeyRound, Link2, MapPin, Navigation, SlidersHorizontal, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { countdownText } from '../lib/countdown';
import { formatMinutes, formatTime, mapsUrl, MODE_NOUN } from '../lib/format';
import { timingFor } from '../lib/plan';
import { hasApiKey } from '../lib/routes';
import { useSettings } from '../lib/settings';
import { useTrips } from '../lib/trips';
import type { Trip } from '../types';
import { MODE_ICON } from './icons';
import { Banner, Button, Card, StatusPill } from './ui';

/** Upcoming's notices: demo data, missing access, broken calendars, no Maps key. */
export function UpcomingBanners() {
  const navigate = useNavigate();
  const { settings, update } = useSettings();
  const { usingDemo, locationAccess, feedErrors, googleError, refresh } = useTrips();
  const brokenFeeds = Object.keys(feedErrors).length;

  return (
    <>
      {usingDemo ? (
        <Banner
          icon={FlaskConical}
          title="Showing sample events"
          body={settings.demoMode ? 'Demo mode is on, so travel times are made up.' : 'Connect Google Calendar or add a calendar link in Connections to see your real events.'}
          action={
            settings.demoMode
              ? { label: 'Use my calendar', onClick: () => update({ demoMode: false }) }
              : { label: 'Connect a calendar', onClick: () => navigate('/connections') }
          }
        />
      ) : null}
      {!usingDemo && googleError ? (
        <Banner
          tone="warn"
          icon={CircleAlert}
          title="Google Calendar isn’t loading"
          body={googleError}
          action={{ label: 'Check connections', onClick: () => navigate('/connections') }}
        />
      ) : null}
      {!usingDemo && brokenFeeds > 0 ? (
        <Banner
          tone="warn"
          icon={Link2}
          title={brokenFeeds === 1 ? 'A calendar link isn’t loading' : `${brokenFeeds} calendar links aren’t loading`}
          body={Object.values(feedErrors)[0]}
          action={{ label: 'Check connections', onClick: () => navigate('/connections') }}
        />
      ) : null}
      {!usingDemo && locationAccess === 'denied' ? (
        <Banner
          tone="warn"
          icon={MapPin}
          title="Location is off"
          body="Travel times are measured from where you are now. Allow location for this site in your browser, or set a start address on each trip."
          // Browsers have no settings page to open; the permission lives in the address bar.
          action={{ label: 'Try again', onClick: refresh }}
        />
      ) : null}
      {!usingDemo && !hasApiKey ? (
        <Banner
          tone="warn"
          icon={KeyRound}
          title="Google Maps key missing"
          body="Add VITE_GOOGLE_MAPS_API_KEY to .env.local and restart the dev server. Until then, try demo mode in Connections."
        />
      ) : null}
    </>
  );
}

/** The next departure: countdown on the left, event and actions on the right. */
export function NextDeparture({ trip, now, onDetails }: { trip: Trip; now: number; onDetails: () => void }) {
  const { settings } = useSettings();
  const timing = timingFor(trip, now);
  const { lead, value, aside } = countdownText(trip, timing, settings.leaveTimeStyle);
  const { event, route } = trip;

  return (
    <Card className={`hero status-${timing.status}`}>
      <div className="hero-count" role="status" aria-label={`${lead} ${value}${aside ? `, ${aside}` : ''}`}>
        <div className="row between g-md wrap">
          <StatusPill status={timing.status} />
          {aside ? <span className="t-caption">{aside}</span> : null}
        </div>
        <div style={{ flex: 1, minHeight: 16 }} />
        <p className="t-caption">{lead}</p>
        <p className="t-display">{value}</p>
      </div>

      <div className="hero-body">
        <p className="t-overline muted">Next departure</p>
        <h2 className="t-heading" style={{ fontSize: 22, lineHeight: '28px' }}>
          {event.title}
        </h2>
        <div className="stack g-xs">
          <Meta icon={Clock} text={`Starts ${formatTime(event.start)}`} />
          <Meta icon={MapPin} text={event.location ?? ''} />
          {route ? (
            <Meta
              icon={MODE_ICON[trip.mode]}
              text={`${formatMinutes(route.durationSec / 60)} ${MODE_NOUN[trip.mode]} · arrive ${trip.graceMin ? `${trip.graceMin} min early` : 'on time'}`}
            />
          ) : (
            <Meta icon={CircleAlert} text={trip.error ?? 'No estimate yet'} />
          )}
        </div>
        <div className="hero-actions">
          {event.location ? (
            <a className="btn btn-primary" style={{ textDecoration: 'none' }} href={mapsUrl(event.location, trip.mode, trip.origin)} target="_blank" rel="noreferrer">
              <Navigation size={20} aria-hidden />
              Open directions
            </a>
          ) : null}
          <Button variant="secondary" icon={SlidersHorizontal} label="Trip settings" onClick={onDetails} />
        </div>
      </div>
    </Card>
  );
}

function Meta({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="meta">
      <Icon size={16} aria-hidden />
      <span>{text}</span>
    </div>
  );
}

/** One trip in the list. On laptops it selects the trip; on smaller screens it opens it. */
export function TripListRow({ trip, now, selected, onClick }: { trip: Trip; now: number; selected?: boolean; onClick: () => void }) {
  const timing = timingFor(trip, now);
  const { event, route } = trip;
  const ModeIcon = MODE_ICON[trip.mode];

  return (
    <button
      type="button"
      className="trip-row"
      aria-current={selected ? 'true' : undefined}
      onClick={onClick}
      aria-label={`${event.title}, starts ${formatTime(event.start)}. ${route ? `Leave by ${formatTime(route.leaveBy)}.` : (trip.error ?? '')}${trip.notify ? '' : ' Alerts off.'}`}
    >
      <span className="trip-leave">
        <span className="t-overline muted" style={{ display: 'block' }}>
          Leave
        </span>
        <span className="t-strong tabular">{route ? formatTime(route.leaveBy) : '—'}</span>
      </span>
      <span className="stack g-xs grow">
        <span className="t-strong ellipsis">{event.title}</span>
        <span className="t-caption muted ellipsis">
          Starts {formatTime(event.start)} · {event.location}
        </span>
        <span className="pill-inline">
          <StatusPill status={timing.status} />
        </span>
      </span>
      <span className="pill-side">
        <StatusPill status={timing.status} />
      </span>
      <span className="trip-icons" aria-hidden>
        {!trip.notify ? <BellOff size={18} /> : null}
        <ModeIcon size={18} />
      </span>
      <ChevronRight size={18} className="chevron" aria-hidden />
    </button>
  );
}

const HOUR = 3_600_000;

/**
 * A Gantt-style view of the coming hours: one row per trip, showing the travel window (coloured
 * by status), the grace period and the event itself, with a line for "now".
 */
export function ScheduleChart({ trips, now, selected, onSelect }: { trips: Trip[]; now: number; selected?: string; onSelect: (trip: Trip) => void }) {
  if (trips.length === 0) return null;

  // From the start of this hour to the end of the last event, at least three hours.
  const start = Math.floor(now / HOUR) * HOUR;
  const lastEnd = Math.max(...trips.map((x) => x.event.end.getTime()));
  const end = Math.max(start + 3 * HOUR, Math.ceil(lastEnd / HOUR) * HOUR);
  const span = end - start;
  const pct = (ms: number) => Math.min(100, Math.max(0, ((ms - start) / span) * 100));
  const bar = (from: number, to: number) => ({ left: `${pct(from)}%`, width: `${Math.max(0.6, pct(to) - pct(from))}%` });

  const hours = span / HOUR;
  const step = Math.max(1, Math.ceil(hours / 7));
  const ticks: number[] = [];
  for (let h = 0; h <= hours; h += step) ticks.push(start + h * HOUR);

  return (
    <Card className="panel">
      <div className="row between g-md wrap">
        <h2 className="t-heading">Your next {Math.round(hours)} hours</h2>
        <div className="legend t-caption muted" aria-hidden>
          <span>
            <span className="swatch" style={{ background: 'var(--relaxed-bg)', borderColor: 'var(--relaxed-fg)' }} />
            Travel
          </span>
          <span>
            <span className="swatch" style={{ background: 'var(--surface-alt)', borderColor: 'var(--muted)', borderStyle: 'dashed' }} />
            Arrive early
          </span>
          <span>
            <span className="swatch" style={{ background: 'var(--primary)', borderColor: 'var(--primary)' }} />
            Event
          </span>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <div className="chart-row" aria-hidden>
          <span />
          <div className="track" style={{ height: 18 }}>
            {ticks.map((tick) => (
              <span key={tick} className="tick" style={{ left: `${pct(tick)}%` }}>
                {new Date(tick).toLocaleTimeString([], { hour: 'numeric' })}
              </span>
            ))}
          </div>
        </div>

        {trips.map((trip) => {
          const timing = timingFor(trip, now);
          const leave = trip.route?.leaveBy.getTime();
          return (
            <button
              key={trip.event.key}
              type="button"
              className={`chart-row chart-trip status-${timing.status}`}
              aria-current={selected === trip.event.key ? 'true' : undefined}
              onClick={() => onSelect(trip)}
              aria-label={`${trip.event.title}: ${leave ? `leave ${formatTime(trip.route!.leaveBy)}, ` : ''}starts ${formatTime(trip.event.start)}`}
            >
              <span className="stack" style={{ minWidth: 0 }}>
                <span className="t-caption ellipsis" style={{ fontWeight: 600 }}>
                  {trip.event.title}
                </span>
                <span className="t-caption muted ellipsis" style={{ fontSize: 12 }}>
                  {leave ? `Leave ${formatTime(trip.route!.leaveBy)}` : 'No estimate'}
                </span>
              </span>
              <span className="track" aria-hidden>
                {ticks.map((tick) => (
                  <span key={tick} className="grid-line" style={{ left: `${pct(tick)}%` }} />
                ))}
                {leave ? <span className="bar bar-travel" style={bar(leave, trip.arriveBy.getTime())} /> : null}
                {trip.graceMin > 0 ? <span className="bar bar-grace" style={bar(trip.arriveBy.getTime(), trip.event.start.getTime())} /> : null}
                <span className="bar bar-event" style={bar(trip.event.start.getTime(), trip.event.end.getTime())} />
              </span>
            </button>
          );
        })}

        {/* Now marker, across the tracks */}
        <div className="chart-overlay chart-row" aria-hidden>
          <span />
          <div style={{ position: 'relative', height: '100%' }}>
            <span className="now-line" style={{ left: `${pct(now)}%` }} />
          </div>
        </div>
      </div>
    </Card>
  );
}

