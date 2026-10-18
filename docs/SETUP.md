# Setup: API keys, sign-in and calendars

None of this is needed to try the app: without keys it runs in demo mode with sample events. Put keys in `.env.local` (copy `.env.example`) and restart `npm run dev` after changing it.

The web app can share the phone app's Google Cloud and Supabase projects. If you've set those up for the phone, reuse the same values and only do the web-specific steps marked **(web)**.

## 1. Google Maps API key

1. Go to <https://console.cloud.google.com/>, create a project, and enable billing. Google's free monthly credit covers personal use.
2. Under **APIs & Services → Library**, enable **Routes API**.
3. Under **APIs & Services → Credentials**, create an **API key**.
4. Restrict the key **(web)**. Under *API restrictions*, allow only **Routes API**. Under *Application restrictions*, choose **Websites** and add your site, for example `http://localhost:5173/*` and your real domain. The key is visible in the browser, so restricting it matters.
5. Add it to `.env.local`:

   ```
   VITE_GOOGLE_MAPS_API_KEY=your-key-here
   ```

## 2. Supabase (accounts, settings sync, calendar links)

1. Create a project at <https://supabase.com/dashboard>, or reuse the phone app's.
2. In the SQL editor, run the phone app's `supabase/migrations/20261011000000_user_settings.sql` if you haven't already. It creates the `user_settings` table both apps use.
3. From **Connect** (or Project Settings → API), copy the project URL and publishable key:

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

4. Deploy the calendar-link proxy **(web)**. Google and iCloud don't let browsers download calendar files, so the app loads them through this function. It only returns calendar files, refuses private network addresses, and doesn't log or store the links.

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase functions deploy ics-proxy --no-verify-jwt
   ```

## 3. Google sign-in and Google Calendar

1. In Google Cloud Console, enable the **Google Calendar API**.
2. Set up the **OAuth consent screen** with the scope `.../auth/calendar.readonly`. While the app is in *Testing*, add your Google account as a test user.
3. Under **Credentials**, create (or open) a **Web application** OAuth client:
   - **Authorized JavaScript origins (web):** your site, for example `http://localhost:5173` and your real domain.
   - **Authorized redirect URIs:** `https://<your-project-ref>.supabase.co/auth/v1/callback`.
4. In Supabase, go to **Authentication → Sign In / Providers → Google**, turn it on, and paste the Web client ID and secret.
5. In Supabase, go to **Authentication → URL Configuration** and add your site to **Redirect URLs** **(web)**, for example `http://localhost:5173/**`.
6. Add the client ID, then restart `npm run dev`:

   ```
   VITE_GOOGLE_WEB_CLIENT_ID=....apps.googleusercontent.com
   ```

Without a client ID, the Google buttons stay hidden and the app offers guest mode and calendar links.

If sign-in fails: **redirect_uri_mismatch** means the redirect URI in step 3 is missing; landing on the wrong page afterwards means the Redirect URL in step 5 is missing; **Access blocked** means your account isn't a test user (step 2).

**Continue with Google** redirects to Google and back. **Connect Google Calendar** opens Google's pop-up instead, so guests can use it too. Browsers only get a one-hour Google token with no refresh token, so after an hour the app asks you to **Reconnect** in Connections.

## 4. Or add a calendar link

In the app, open **Connections → Calendar links** and paste a link. This needs the `ics-proxy` function from step 2. The app shows these steps too:

- **Google Calendar:** go to **calendar.google.com/calendar/r/settings** → **Settings for my calendars** → your name → **Integrate calendar** → copy **Secret address in iCal format** (ends in `/basic.ics`). School and work accounts often have this turned off.
- **iCloud** (on iPhone): Calendar app → Calendars → ⓘ next to a calendar → turn on **Public Calendar** → *Share Link…* → Copy.

Treat these links like passwords. Google refreshes them every few hours, so new events can lag.

## 5. Leave alerts

Turn on **Leave alerts** in Preferences and allow notifications when the browser asks. Alerts come from the open tab, so keep a Leavy tab open (it can be in the background).

**What's stored where:** Supabase stores your account and preferences (grace period, travel mode, alerts, per-event overrides), shared with the phone app. Calendar links, Google tokens and event data stay in your browser.
