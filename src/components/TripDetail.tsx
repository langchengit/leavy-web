import { Calendar, CalendarX, CircleAlert, Flag, House, LocateFixed, Navigation, type LucideIcon } from 'lucide-react';

import { countdownText } from '../lib/countdown';
import { formatDistance, formatMinutes, formatTime, MODE_LABEL, MODE_NOUN, mapsUrl } from '../lib/format';
import { timingFor } from '../lib/plan';
import { useSettings, type Settings } from '../lib/settings';
import type { Trip } from '../types';
import { GraceStepper, ModePicker, OriginPicker } from './controls';
import { MODE_ICON } from './icons';
import { Card, LinkButton, SectionHeader, StatusPill, SwitchRow } from './ui';

type OverrideField = 'modeOverrides' | 'graceOverrides' | 'notifyOverrides' | 'originOverrides';

/** A trip's countdown, timeline, directions and its per-event settings. */
export function TripDetail({ trip, now }: { trip: Trip; now: number }) {
  const { settings, update } = useSettings();
  const key = trip.event.key;

  // Writes (or with `undefined`, clears) this event's entry in one of the override maps.
  function setOverride<F extends OverrideField>(field: F, value: Settings[F][string] | undefined) {
    const next = { ...settings[field] } as Settings[F];
    if (value === undefined) delete next[key];
    else next[key] = value;
    update({ [field]: next } as Partial<Settings>);
  }

  const timing = timingFor(trip, now);
  const { lead, value, aside } = countdownText(trip, timing, settings.leaveTimeStyle);
  const { event, route } = trip;

  return (
    <div>
      <div className={`countdown status-${timing.status}`} role="status" aria-label={`${lead} ${value}${aside ? `, ${aside}` : ''}`}>
        <div className="row between">
          <StatusPill status={timing.status} />
          {aside ? <span className="t-caption">{aside}</span> : null}
        </div>
        <p className="t-caption" style={{ marginTop: 12 }}>
          {lead}
        </p>
        <p className="t-display">{value}</p>
      </div>

      <div style={{ marginTop: 16 }}>
        <Card>
          {route ? (
            <Timeline trip={trip} />
          ) : (
            <div className="row g-sm" style={{ alignItems: 'flex-start' }}>
              <CircleAlert size={20} color="var(--soon-fg)" aria-hidden style={{ flexShrink: 0 }} />
              <p className="grow">{trip.error ?? 'No travel estimate yet.'}</p>
            </div>
          )}
        </Card>
      </div>

      {event.location ? (
        <a className="btn btn-primary" style={{ marginTop: 16, textDecoration: 'none' }} href={mapsUrl(event.location, trip.mode, trip.origin)} target="_blank" rel="noreferrer">
          <Navigation size={20} aria-hidden />
          Open directions
        </a>
      ) : null}

      <SectionHeader title="Leaving from" aside={trip.origin ? 'Just this event' : 'Default'} />
      <OriginPicker
        // A different trip starts with a closed editor and its own draft.
        key={key}
        value={trip.origin}
        recent={[...new Set(Object.values(settings.originOverrides))].reverse()}
        onChange={(address) => setOverride('originOverrides', address)}
      />

      <SectionHeader title="Getting there by" aside={settings.modeOverrides[key] ? 'Just this event' : 'Default'} />
      <ModePicker value={trip.mode} onChange={(m) => setOverride('modeOverrides', m === settings.defaultMode ? undefined : m)} />

      <SectionHeader title="Arrive early by" aside={settings.graceOverrides[key] != null ? 'Just this event' : 'Default'} />
      <Card>
        <GraceStepper value={trip.graceMin} onChange={(m) => setOverride('graceOverrides', m)} />
        {settings.graceOverrides[key] != null ? (
          <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
            <LinkButton label={`Use default (${settings.graceMin} min)`} onClick={() => setOverride('graceOverrides', undefined)} />
          </div>
        ) : null}
      </Card>

      <SectionHeader title="Alerts for this event" aside={settings.notifyOverrides[key] != null ? 'Just this event' : 'Default'} />
      <Card>
        <SwitchRow label="Leave alerts" helper={alertHelper(trip, settings.headsUpMin, now)} value={trip.notify} onChange={(on) => setOverride('notifyOverrides', on)} />
        {settings.notifyOverrides[key] != null ? (
          <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
            <LinkButton label={`Use default (${settings.notifications ? 'on' : 'off'})`} onClick={() => setOverride('notifyOverrides', undefined)} />
          </div>
        ) : null}
      </Card>
    </div>
  );
}

/** Shown when the trip in the URL has started or dropped out of the upcoming list. */
export function TripMissing({ refreshing }: { refreshing: boolean }) {
  return (
    <div className="empty-state">
      <CalendarX size={36} color="var(--muted)" aria-hidden />
      <p>{refreshing ? 'Updating…' : 'This event has started or is no longer in your upcoming list.'}</p>
    </div>
  );
}

function alertHelper(trip: Trip, headsUpMin: number, now: number): string {
  if (!trip.notify) return 'No alerts for this event.';
  if (!trip.route) return 'Alerts start once there’s a travel estimate.';
  const leave = trip.route.leaveBy.getTime();
  if (leave <= now) return 'The leave time has passed, so there are no alerts left to send.';
  const times = [];
  if (headsUpMin > 0 && leave - headsUpMin * 60_000 > now) times.push(formatTime(new Date(leave - headsUpMin * 60_000)));
  times.push(formatTime(trip.route.leaveBy));
  return `Notify me at ${times.join(' and ')}.`;
}

/** Leave → travel → arrive → event starts, as a vertical timeline. */
function Timeline({ trip }: { trip: Trip }) {
  const route = trip.route!;
  const travelDetail = [formatDistance(route.distanceMeters), route.transitSummary].filter(Boolean).join(' · ');

  const steps: { icon: LucideIcon; time?: string; title: string; detail?: string; strong?: boolean }[] = [
    { icon: trip.origin ? House : LocateFixed, time: formatTime(route.leaveBy), title: 'Leave', detail: trip.origin ?? 'From your current location', strong: true },
    { icon: MODE_ICON[trip.mode], title: `${formatMinutes(route.durationSec / 60)} ${MODE_NOUN[trip.mode]}`, detail: travelDetail || MODE_LABEL[trip.mode] },
    { icon: Flag, time: formatTime(trip.arriveBy), title: 'Arrive', detail: trip.graceMin ? `${trip.graceMin} min to spare` : 'Right on time' },
    { icon: Calendar, time: formatTime(trip.event.start), title: trip.event.title, detail: trip.event.location ?? undefined },
  ];

  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {steps.map((s, i) => (
        <li key={i} className="timeline-step">
          <div className="timeline-rail" aria-hidden>
            <div className={`timeline-node ${s.strong ? 'strong' : ''}`}>
              <s.icon size={16} />
            </div>
            {i < steps.length - 1 ? <div className="timeline-line" /> : null}
          </div>
          <div className="grow" style={{ paddingBottom: i < steps.length - 1 ? 16 : 0 }}>
            <div className="row between g-sm" style={{ alignItems: 'flex-start' }}>
              <p className={s.strong ? 't-heading' : 't-strong'}>{s.title}</p>
              {s.time ? (
                <p className={`${s.strong ? 't-heading' : 't-strong'} tabular`} style={s.strong ? { color: 'var(--primary)' } : undefined}>
                  {s.time}
                </p>
              ) : null}
            </div>
            {s.detail ? <p className="t-caption muted">{s.detail}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
