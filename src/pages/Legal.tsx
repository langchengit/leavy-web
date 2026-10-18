import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Logo } from '../components/ui';
import { useTitle } from '../hooks';

// Public pages: reachable without signing in, and linked from Google's OAuth consent screen.

const UPDATED = 'October 17, 2026';
const CONTACT = 'https://github.com/langchengit/leavy-web/issues';

function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  useTitle(title);
  return (
    <div className="legal">
      <header className="row between wrap g-md">
        <Link to="/" className="brand" style={{ margin: 0 }}>
          <Logo size={32} />
          Leavy
        </Link>
        <nav className="row g-lg t-caption">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </nav>
      </header>
      <article>
        <h1 className="t-title">{title}</h1>
        <p className="t-caption muted">Last updated {UPDATED}</p>
        {children}
      </article>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>
        Leavy (“we”, “the app”) reads your calendar, checks travel time to each event, and tells you when to leave. This policy covers the Leavy web app at
        leavy-web.vercel.app and the Leavy phone app, which share the same account system.
      </p>

      <h2>What we access</h2>
      <ul>
        <li>
          <strong>Google account basics.</strong> If you sign in with Google, we receive your name, email address and profile picture so we can create your account
          and show who is signed in.
        </li>
        <li>
          <strong>Google Calendar (read-only).</strong> With your permission (scope <code>calendar.readonly</code>), the app reads the list of calendars you show in
          Google Calendar and the events in the next few hours: title, start and end time, location, and whether you declined. We never create, change or delete
          events.
        </li>
        <li>
          <strong>Calendar links.</strong> If you add a private calendar link (.ics), it is fetched through our server so your browser can read it. The link is not
          logged or stored on our server.
        </li>
        <li>
          <strong>Your location.</strong> If you allow it, your browser’s location is used as the starting point for travel times.
        </li>
        <li>
          <strong>Preferences.</strong> Settings such as grace period, travel mode, alert timing and any start addresses you type for specific events.
        </li>
      </ul>

      <h2>How we use it</h2>
      <p>
        Only to show your upcoming events, work out when you need to leave, and send you leave alerts. Calendar events are processed in your browser and are not
        saved on our servers. To calculate travel time, the event’s location and your starting point (your location, rounded to about 100 m, or an address you
        entered) are sent to the Google Maps Routes API.
      </p>

      <h2>What we store</h2>
      <ul>
        <li>
          <strong>On your device:</strong> your settings, calendar links and a short-lived Google access token (it expires after about an hour), kept in your
          browser’s local storage.
        </li>
        <li>
          <strong>On our servers (Supabase):</strong> if you sign in, your account (name, email, Google account ID) and your synced preferences, so they follow you
          between the web and phone apps. Calendar events, calendar links and Google tokens are not stored there.
        </li>
      </ul>

      <h2>Sharing</h2>
      <p>
        We don’t sell your data, use it for advertising, or share it with anyone except the services that run the app: Supabase (accounts and settings), Google
        (sign-in, Calendar and Maps) and Vercel (hosting). Each processes data only to provide its service.
      </p>

      <h2>Google API Services</h2>
      <p>
        Leavy’s use and transfer of information received from Google APIs adheres to the{' '}
        <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements. Google user data is not used to develop, improve or train generalized AI or machine learning models, and no
        human reads it unless you ask us to for support, it’s needed for security, or the law requires it.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Disconnect Google Calendar any time in Connections, or remove Leavy’s access in your Google account’s security settings.</li>
        <li>Sign out to clear the Google token from your browser. Clearing your site data removes everything stored on your device.</li>
        <li>To delete your account and synced preferences, contact us (below) and we’ll delete them within 30 days.</li>
      </ul>

      <h2>Security and retention</h2>
      <p>
        All traffic is encrypted with HTTPS. Account data is kept until you ask us to delete it. Leavy is not meant for children under 13 and we don’t knowingly
        collect their data.
      </p>

      <h2>Changes and contact</h2>
      <p>
        If this policy changes, we’ll update the date at the top. Questions or deletion requests:{' '}
        <a href={CONTACT} target="_blank" rel="noreferrer">
          open an issue on GitHub
        </a>
        .
      </p>
    </LegalLayout>
  );
}

export function TermsPage() {
  return (
    <LegalLayout title="Terms of Service">
      <p>By using Leavy (the web app at leavy-web.vercel.app or the phone app), you agree to these terms. If you don’t agree, please don’t use the app.</p>

      <h2>The service</h2>
      <p>
        Leavy reads your calendar, estimates travel time with Google Maps, and suggests when to leave. It is free and provided for personal use. We may change,
        pause or stop it at any time.
      </p>

      <h2>Estimates, not guarantees</h2>
      <p>
        Leave times are estimates based on calendar data and third-party traffic and transit information, which can be wrong or out of date. Alerts may be late
        or not arrive at all, for example if your browser tab is closed or notifications are blocked. Always use your own judgment, and follow traffic laws
        and road conditions. We are not responsible for missed events, delays, or anything that happens on your trip.
      </p>

      <h2>Your account</h2>
      <p>
        You’re responsible for your Google account and for the calendars and links you connect. Don’t use Leavy to break the law, to access calendars you
        aren’t allowed to, or to overload or attack the service.
      </p>

      <h2>Third-party services</h2>
      <p>
        Leavy relies on Google (sign-in, Calendar, Maps), Supabase and Vercel. Your use of those services is also covered by their own terms, including the{' '}
        <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer">
          Google Terms of Service
        </a>{' '}
        and{' '}
        <a href="https://maps.google.com/help/terms_maps/" target="_blank" rel="noreferrer">
          Google Maps Terms of Service
        </a>
        .
      </p>

      <h2>Open source</h2>
      <p>
        Leavy’s source code is available under the{' '}
        <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" rel="noreferrer">
          GNU GPL v3.0 or later
        </a>
        . These terms cover the hosted service; the license covers the code.
      </p>

      <h2>No warranty</h2>
      <p>
        Leavy is provided “as is”, without warranties of any kind. To the fullest extent the law allows, we are not liable for any indirect, incidental or
        consequential damages arising from your use of the app.
      </p>

      <h2>Ending use</h2>
      <p>
        You can stop using Leavy at any time and ask us to delete your account (see the <Link to="/privacy">Privacy Policy</Link>). We may suspend access if these
        terms are broken.
      </p>

      <h2>Changes and contact</h2>
      <p>
        If these terms change, we’ll update the date at the top; using the app after that means you accept them. Questions:{' '}
        <a href={CONTACT} target="_blank" rel="noreferrer">
          open an issue on GitHub
        </a>
        .
      </p>
    </LegalLayout>
  );
}
