# Leavy for the web

The browser version of [Leavy](https://github.com/langchengit/leavy). It reads your calendar, checks live travel time with Google Maps, and tells you **when to leave** for each event. It adds a grace period so you arrive a few minutes early, and sends a browser notification when it's time to go.

```
leave by = event start − grace period − travel time
```

It has the same features as the phone app, laid out for bigger screens:

- **Laptops:** a sidebar, your next departure up top, a chart of the coming hours, and each trip's details and settings beside the list.
- **Tablets:** an icon rail and one column; trips open on their own page.
- **Phones:** a top bar with tabs.

What it does:

- **Calendars:** Google Calendar (with Google sign-in or the "Connect" pop-up), or a private iCal link from Google, iCloud or Outlook.
- **Travel:** driving with live traffic, transit on real schedules, walking or cycling. Each event can have its own travel mode, grace period, alerts and start address.
- **Leave time your way:** a countdown ("Leave in 25 min") or the clock time ("Leave at 6:30 PM").
- **Accounts:** optional Google sign-in. Preferences sync with the phone app through the same Supabase project.
- **Demo mode:** sample events, so it runs with no keys or accounts.

Built with Vite, React, TypeScript, React Router and Supabase. No Expo or React Native.

## Run it locally

You need Node.js 20+.

```bash
npm install
cp .env.example .env.local   # leave it blank for demo mode
npm run dev                  # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Typecheck and build a static site into `dist/` |
| `npm run preview` | Serve the built site locally |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |

**Live data:** with no keys, the app shows sample events. Add a Google Maps key for real travel times, and the Supabase and Google keys for sign-in and real calendars. [docs/SETUP.md](docs/SETUP.md) walks through each one.

## Project layout

- `src/pages/`: Upcoming, Trip, Connections, Preferences and the welcome screen.
- `src/components/`: the app shell (`Shell.tsx`), UI primitives (`ui.tsx`), controls, trip details and the Upcoming and Connections pieces.
- `src/lib/`: logic. `trips.tsx` builds trips from events, `plan.ts` decides each trip's status, `routes.ts` calls the Routes API, `settings.tsx` stores preferences, `cloudSync.ts` syncs them, `auth.tsx` handles sign-in.
- `src/styles.css`: all styles, including dark mode and the three layouts.
- `supabase/functions/ics-proxy`: loads calendar links for the browser.

## Deploying

`npm run build` writes a static site to `dist/`. Host it anywhere that serves a single-page app (send unknown paths to `index.html`), then add the domain to the Google and Supabase settings in [docs/SETUP.md](docs/SETUP.md).

**Vercel:** `vercel.json` is set up. Import the repo (or run `npx vercel`), add the `VITE_` variables from `.env.local` under *Settings → Environment Variables*, and redeploy. Then add the Vercel domain in Google Cloud (JavaScript origins), Supabase (Redirect URLs) and the Maps key's website restrictions.

## Known limits

- Google Calendar access in a browser lasts an hour, then you choose **Reconnect** in Connections.
- Alerts only arrive while a Leavy tab is open (it can be in the background).
- The phone's own calendars aren't available in a browser. Use Google Calendar or a calendar link (including iCloud).
- Per-event settings apply to one occurrence of a recurring event.

## License

Leavy is free software, licensed under the [GNU General Public License v3.0 or later](LICENSE).
