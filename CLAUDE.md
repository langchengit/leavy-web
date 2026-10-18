# Leavy for the web

The browser version of Leavy: it reads the user's calendar, gets travel times from the Google Routes API, and tells them when to leave. Vite + React + TypeScript + React Router, no Expo or React Native. The phone app lives in a separate repo (`../when-to-leave`) and shares the same Supabase project and `user_settings` table. See README.md and docs/SETUP.md.

## Layout

- `src/pages/`: `Upcoming.tsx`, `Trip.tsx`, `Connections.tsx`, `Preferences.tsx`, `SignIn.tsx`, `Legal.tsx` (privacy policy and terms). Routes are in `App.tsx`.
- `src/components/`: `Shell.tsx` (navigation), `ui.tsx` (Card, Panel, Section, Button, Chip, SwitchRow, LinkButton, Banner, StatusPill, Logo, Spinner), `controls.tsx` (ModePicker, GraceStepper, OriginPicker, preference controls), `TripDetail.tsx`, `upcoming.tsx`, `connections.tsx`, `icons.tsx` (lucide-react). Reuse these instead of new one-off markup.
- `src/styles.css`: every style. Colours are CSS variables with a dark-mode block; use them (`var(--primary)`, `var(--muted)`, status classes like `status-soon`) instead of new colours. The three layouts are media queries at 1100px and 720px, matched by `useWide()` / `useCompact()` in `hooks.ts`.
- `src/lib/`: logic, kept close to the phone app's so fixes can be ported both ways. `*.test.ts` run with `npm test` (Vitest).
- `supabase/functions/ics-proxy`: Deno edge function that fetches calendar links for the browser.

## How the app works

1. **Start-up and sign-in:** `App.tsx` waits for `AuthProvider` (`auth.tsx`) to be `ready`. With no account and no guest mode it shows `SignInPage` whatever the URL, except `/privacy` and `/terms`, which are public because Google's OAuth consent screen links to them. "Continue as guest" sets `leavy.guest` in localStorage, and `signOut()` clears it. Google sign-in is a Supabase OAuth redirect; the returned Google token is kept by `rememberGoogleToken()` (`google.ts`).
2. **Settings:** `SettingsProvider` (`settings.tsx`) loads `wtl.settings.v1` from localStorage, merged over `DEFAULT_SETTINGS`. `CloudSync` (`cloudSync.ts`) pulls the `SYNCED` keys once per sign-in, then pushes changes after a short delay.
3. **Events:** `refresh()` in `trips.tsx` collects events from Google Calendar (`googleCalendar.ts`) and calendar links (`icsFeed.ts`, through `ics-proxy`). It removes duplicates and keeps events between now and `lookAheadHours` ahead. With no source, or with `demoMode` on, it uses `demo.ts`.
4. **Trips:** for each event with a location, `trips.tsx` applies the per-event overrides, works out `arriveBy = start − grace`, and calls `getRoute()` (`routes.ts`) from the start address or the browser's location. Errors become `trip.error` and never throw out of `refresh()`.
5. **Status and display:** `timingFor()` (`plan.ts`) gives the status; `countdownText()` (`countdown.ts`) gives the text, using `leaveTimeStyle`.
6. **Alerts:** after each refresh, `syncLeaveAlerts()` (`notifications.ts`) clears this tab's timers and sets new ones from `leaveAlerts()` (`alerts.ts`), shown with the Notification API.
7. **Refreshing:** on settings changes, every 5 minutes, when the tab becomes visible, and from the refresh button or the R key. A newer refresh overrides an older one through `runId`.

## Behaviour that must keep working

- A fresh visit opens the welcome screen. **Continue as guest** opens Upcoming. **Back to the welcome screen** (Connections → Account) returns a guest to it.
- With **no keys at all**, the app runs in demo mode and nothing throws. Google buttons are hidden unless `VITE_GOOGLE_WEB_CLIENT_ID` is set; hidden, not broken.
- **Layouts:** works at phone, tablet and laptop widths. On laptops a trip opens beside the list (`/?trip=<key>`), and `/trip/<key>` redirects there.
- **Leave time** = event start − grace period − travel time. For transit, it's the first ride's departure minus the walk to the stop.
- **Status thresholds:** On track above 15 min before leaving; Leave soon from 15 to 0 min; Leave now once the leave time has passed but you'd still arrive on time; Running late when you'd arrive 1 min or more after the start. In Auto, the clock time shows from 60 min out.
- **Per-event overrides** apply only to their event, show "Just this event", and can be reset to the default.
- **Settings** persist across reloads and, when signed in, sync without overwriting the account's saved values on first sign-in. Don't rename settings keys: the phone app reads the same row.
- **Alerts** are only scheduled for future leave times, and never twice for the same trip.
- **Calendar links** are secrets: never put them in a URL, log or error message.
- **Google Calendar:** parallel fetches share one token lookup (`googleAccessToken()`); a 401 drops the token and asks the user to reconnect.

Run `npm run lint`, `npm run typecheck` and `npm test` before calling a change done.
