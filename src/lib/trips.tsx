import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import type { CalEvent, Trip } from '../types';
import { demoEvents, demoRoute } from './demo';
import { fetchGoogleEvents } from './googleCalendar';
import { fetchFeedEvents } from './icsFeed';
import { ensureNotificationPermission, syncLeaveAlerts } from './notifications';
import { getRoute, hasApiKey, type LatLng } from './routes';
import { useSettings } from './settings';

export type LocationAccess = 'granted' | 'denied' | 'unknown';

interface TripsState {
  loading: boolean;
  refreshing: boolean;
  locationAccess: LocationAccess;
  usingDemo: boolean;
  trips: Trip[];
  /** Events in range that have no location, so no travel time can be worked out. */
  noLocation: CalEvent[];
  /** Calendar links that failed to load, keyed by URL. */
  feedErrors: Record<string, string>;
  /** Why Google Calendar didn't load, if it's connected but failed. */
  googleError: string | null;
  updatedAt: Date | null;
}

interface TripsContextValue extends TripsState {
  refresh: () => Promise<void>;
}

const AUTO_REFRESH_MS = 5 * 60_000;

const TripsContext = createContext<TripsContextValue | null>(null);

let lastKnown: { origin: LatLng; at: number } | null = null;

function askPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, options));
}

async function currentPosition(): Promise<{ access: LocationAccess; origin: LatLng | null }> {
  if (!('geolocation' in navigator)) return { access: 'denied', origin: null };
  // A recent fix, then a fresh one. If the browser can't get a fix right now, fall back to the
  // last known position of any age rather than giving up on travel times.
  if (lastKnown && Date.now() - lastKnown.at < 2 * 60_000) return { access: 'granted', origin: lastKnown.origin };
  try {
    const pos = await askPosition({ enableHighAccuracy: false, timeout: 15_000, maximumAge: 2 * 60_000 });
    lastKnown = { origin: { latitude: pos.coords.latitude, longitude: pos.coords.longitude }, at: Date.now() };
    return { access: 'granted', origin: lastKnown.origin };
  } catch (e) {
    // Only an actual "no" counts as denied; timeouts and missing fixes fall back.
    if ((e as GeolocationPositionError).code === 1) return { access: 'denied', origin: null };
    console.warn('Current location unavailable, using last known', e);
    return { access: 'granted', origin: lastKnown?.origin ?? null };
  }
}

export function TripsProvider({ children }: { children: ReactNode }) {
  const { settings, ready } = useSettings();
  const [state, setState] = useState<TripsState>({
    loading: true,
    refreshing: false,
    locationAccess: 'unknown',
    usingDemo: false,
    trips: [],
    noLocation: [],
    feedErrors: {},
    googleError: null,
    updatedAt: null,
  });
  // Ignore results from a refresh that a newer one has overtaken.
  const runId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++runId.current;
    setState((s) => ({ ...s, refreshing: true }));

    const now = Date.now();
    const feeds = settings.calendarFeeds;
    const noCalendar = feeds.length === 0 && !settings.googleCalendar;
    // Sample data when the user asked for it, or automatically only when there's no Maps key and
    // no calendar (a fresh checkout). Signed-in users with no calendar get a prompt instead.
    const usingDemo = settings.demoMode || (noCalendar && !hasApiKey);

    let events: CalEvent[];
    let locationAccess: LocationAccess = 'unknown';
    let origin: LatLng | null = null;
    const feedErrors: Record<string, string> = {};
    let googleError: string | null = null;

    if (usingDemo) {
      events = demoEvents(now);
    } else if (noCalendar) {
      // Nothing to plan, so don't ask for location yet.
      events = [];
    } else {
      const from = new Date(now);
      const to = new Date(now + settings.lookAheadHours * 3_600_000);
      const [googleEvents, ...feedEvents] = await Promise.all([
        settings.googleCalendar
          ? fetchGoogleEvents(from, to).catch((e) => {
              googleError = e instanceof Error ? e.message : 'Couldn’t load Google Calendar.';
              return [];
            })
          : Promise.resolve([]),
        ...feeds.map((url) =>
          fetchFeedEvents(url, from, to).catch((e) => {
            feedErrors[url] = e instanceof Error ? e.message : 'Couldn’t load this calendar.';
            return [];
          }),
        ),
      ]);
      // The same Google calendar can arrive via the API and a link; keep one copy.
      const seen = new Set<string>();
      events = [googleEvents, ...feedEvents].flat().filter((e) => {
        const id = `${e.title}|${e.start.getTime()}`;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      try {
        ({ access: locationAccess, origin } = await currentPosition());
      } catch (e) {
        console.warn('Location failed', e);
      }
    }

    const horizon = now + settings.lookAheadHours * 3_600_000;
    const upcoming = events
      .filter((e) => e.start.getTime() > now && e.start.getTime() <= horizon)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const trips: Trip[] = await Promise.all(
      upcoming
        .filter((e) => e.location)
        .map(async (event): Promise<Trip> => {
          const mode = settings.modeOverrides[event.key] ?? settings.defaultMode;
          const graceMin = settings.graceOverrides[event.key] ?? settings.graceMin;
          const arriveBy = new Date(event.start.getTime() - graceMin * 60_000);
          const notify = settings.notifyOverrides[event.key] ?? settings.notifications;
          const custom = settings.originOverrides[event.key];
          const trip: Trip = { event, mode, graceMin, arriveBy, notify, origin: custom };

          if (usingDemo) return { ...trip, route: demoRoute(event.key, mode, arriveBy) };
          if (!hasApiKey) return { ...trip, error: 'Add a Google Maps API key to get travel times.' };
          const from = custom ?? origin;
          if (!from) {
            return {
              ...trip,
              error: locationAccess === 'granted' ? 'Couldn’t find your location. Refresh to try again.' : 'Turn on location to get travel times.',
            };
          }
          try {
            return { ...trip, route: await getRoute(from, event.location!, mode, arriveBy) };
          } catch (e) {
            return { ...trip, error: e instanceof Error ? e.message : 'Could not get a route.' };
          }
        }),
    );
    // Soonest departure first; trips without an estimate fall back to their start time.
    trips.sort((a, b) => (a.route?.leaveBy ?? a.event.start).getTime() - (b.route?.leaveBy ?? b.event.start).getTime());

    if (id !== runId.current) return;
    setState({
      loading: false,
      refreshing: false,
      locationAccess,
      usingDemo,
      trips,
      noLocation: upcoming.filter((e) => !e.location),
      feedErrors,
      googleError,
      updatedAt: new Date(),
    });

    // Phones use scheduled notifications; browsers use timers in the open tab (notifications.web.ts).
    const wanted = trips.filter((t) => t.notify);
    const allowed = wanted.length > 0 && (await ensureNotificationPermission());
    await syncLeaveAlerts(allowed ? wanted : [], settings.headsUpMin).catch((e) => console.warn('Alert sync failed', e));
  }, [settings]);

  // Recompute whenever settings change (grace period, mode, calendars…).
  useEffect(() => {
    // refresh() fetches from calendars and Maps; setting `refreshing` up front is intended.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ready) refresh();
  }, [ready, refresh]);

  // Keep data fresh while the tab is open and whenever it's shown again.
  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(refresh, AUTO_REFRESH_MS);
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [ready, refresh]);

  const value = useMemo(() => ({ ...state, refresh }), [state, refresh]);
  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>;
}

export function useTrips(): TripsContextValue {
  const ctx = useContext(TripsContext);
  if (!ctx) throw new Error('useTrips must be used inside TripsProvider');
  return ctx;
}
