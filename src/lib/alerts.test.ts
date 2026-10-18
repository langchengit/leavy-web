import { leaveAlerts } from './alerts';
import type { Trip } from '../types';

function makeTrip(overrides?: Partial<Trip>): Trip {
  const start = new Date('2026-10-13T10:00:00Z');
  const arriveBy = new Date('2026-10-13T09:50:00Z');
  return {
    event: { key: 'e1', title: 'Design Review', start, end: new Date('2026-10-13T11:00:00Z'), location: '123 Main St' },
    mode: 'drive',
    graceMin: 10,
    arriveBy,
    notify: true,
    route: { durationSec: 1800, leaveBy: new Date('2026-10-13T09:20:00Z') },
    ...overrides,
  };
}

const at = (iso: string) => new Date(iso).getTime();

describe('leaveAlerts', () => {
  it('schedules a heads-up and a leave alert when both are in the future', () => {
    const alerts = leaveAlerts([makeTrip()], 10, at('2026-10-13T09:00:00Z'));
    expect(alerts.map((a) => a.id)).toEqual(['wtl-e1-heads', 'wtl-e1-leave']);
    expect(alerts[0].at).toBe(at('2026-10-13T09:10:00Z'));
    expect(alerts[1].at).toBe(at('2026-10-13T09:20:00Z'));
  });

  it('skips a heads-up whose time has passed but keeps the leave alert', () => {
    const alerts = leaveAlerts([makeTrip()], 10, at('2026-10-13T09:15:00Z'));
    expect(alerts.map((a) => a.id)).toEqual(['wtl-e1-leave']);
  });

  it('schedules nothing once the leave time has passed', () => {
    expect(leaveAlerts([makeTrip()], 10, at('2026-10-13T09:21:00Z'))).toEqual([]);
  });

  it('skips trips with alerts off or without a route', () => {
    const now = at('2026-10-13T09:00:00Z');
    expect(leaveAlerts([makeTrip({ notify: false }), makeTrip({ route: undefined })], 10, now)).toEqual([]);
  });

  it('has no heads-up when it is set to off', () => {
    const alerts = leaveAlerts([makeTrip()], 0, at('2026-10-13T09:00:00Z'));
    expect(alerts.map((a) => a.id)).toEqual(['wtl-e1-leave']);
  });
});
