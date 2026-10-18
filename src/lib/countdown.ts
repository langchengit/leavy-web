import { formatMinutes, formatTime } from './format';
import type { TripTiming } from './plan';
import type { LeaveTimeStyle, Trip } from '../types';

/** In "auto", departures at least this far off show the clock time instead of a countdown. */
const CLOCK_AFTER_MIN = 60;

/**
 * The one line you glance at: "Leave in 23 min" or "Leave at 6:30 PM", then "Now" or "6 min late".
 * `aside` is the other form, shown small beside it.
 */
export function countdownText(trip: Trip, timing: TripTiming, style: LeaveTimeStyle): { lead: string; value: string; aside?: string } {
  const leaveBy = trip.route ? formatTime(trip.route.leaveBy) : null;
  switch (timing.status) {
    case 'relaxed':
    case 'soon': {
      const left = formatMinutes(Math.ceil(timing.minToLeave));
      const clock = style === 'clock' || (style === 'auto' && timing.minToLeave >= CLOCK_AFTER_MIN);
      return clock ? { lead: 'Leave at', value: leaveBy!, aside: `in ${left}` } : { lead: 'Leave in', value: left, aside: `by ${leaveBy}` };
    }
    case 'now':
      return { lead: 'Head out', value: 'Now', aside: `by ${leaveBy}` };
    case 'late':
      return { lead: 'If you leave now', value: `${formatMinutes(Math.ceil(timing.lateByMin))} late`, aside: `by ${leaveBy}` };
    default:
      return { lead: 'Leave by', value: '—' };
  }
}
