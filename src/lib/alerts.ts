import type { Trip } from '../types';
import { formatMinutes, formatTime, MODE_NOUN } from './format';

export interface LeaveAlert {
  /** Stable per trip and kind, so rescheduling replaces an alert instead of adding a second one. */
  id: string;
  at: number;
  title: string;
  body: string;
}

export const ALERT_PREFIX = 'wtl-';

/**
 * The alerts to schedule for these trips: an optional heads-up and the leave alert itself.
 * Only future times are returned.
 */
export function leaveAlerts(trips: Trip[], headsUpMin: number, now: number): LeaveAlert[] {
  const alerts: LeaveAlert[] = [];
  for (const trip of trips) {
    if (!trip.route || !trip.notify) continue;
    const leaveAt = trip.route.leaveBy.getTime();
    const travel = `${formatMinutes(trip.route.durationSec / 60)} ${MODE_NOUN[trip.mode]}`;
    const id = `${ALERT_PREFIX}${trip.event.key}`;

    if (headsUpMin > 0 && leaveAt - headsUpMin * 60_000 > now) {
      alerts.push({
        id: `${id}-heads`,
        at: leaveAt - headsUpMin * 60_000,
        title: `Leave in ${headsUpMin} min for ${trip.event.title}`,
        body: `Head out at ${formatTime(trip.route.leaveBy)} · ${travel}`,
      });
    }
    if (leaveAt > now) {
      alerts.push({
        id: `${id}-leave`,
        at: leaveAt,
        title: `Time to leave for ${trip.event.title}`,
        body: `${travel} · arrive by ${formatTime(trip.arriveBy)}`,
      });
    }
  }
  return alerts;
}
