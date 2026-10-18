import { Bell, Calendar, Car, User } from 'lucide-react';

import { SignInButtons } from '../components/connections';
import { Button, Card, Logo, StatusPill } from '../components/ui';
import { useTitle } from '../hooks';
import { useAuth } from '../lib/auth';

const POINTS = [
  { icon: Calendar, text: 'Loads your Google Calendar or a private calendar link' },
  { icon: Car, text: 'Checks live traffic and transit for each event' },
  { icon: Bell, text: 'Tells you when to head out, a few minutes early' },
];

/** Welcome: the pitch and a preview on one side, sign-in on the other. */
export function SignInPage() {
  useTitle('Welcome');
  const { continueAsGuest, configured, googleReady } = useAuth();

  return (
    <div className="welcome">
      <section className="welcome-pitch">
        <div className="welcome-pitch-inner">
          <div className="brand" style={{ margin: 0, padding: 0, fontSize: 22 }}>
            <Logo size={44} />
            Leavy
          </div>
          <h1>Know exactly when to leave.</h1>
          <ul className="stack g-lg" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="row g-md">
                <span className="point-icon">
                  <Icon size={20} aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
          <Preview />
        </div>
      </section>

      <section className="welcome-form">
        <Card className="welcome-card">
          <h2 className="t-title" style={{ fontSize: 24, lineHeight: '30px' }}>
            Get started
          </h2>
          <SignInButtons />
          {configured && googleReady ? <p className="t-caption muted center">Google sign-in also asks to read your calendar.</p> : null}
          <div className="or t-caption">or</div>
          <Button variant="secondary" icon={User} label="Continue as guest" onClick={continueAsGuest} title="Uses Leavy without an account. You can sign in later in Connections." />
          <p className="t-caption muted center">As a guest, add a calendar link or try the sample events. You can sign in later.</p>
        </Card>
      </section>
    </div>
  );
}

/** A static sample of the next-trip card, so people see what they'll get. */
function Preview() {
  return (
    <Card className="preview status-soon">
      <div aria-hidden>
        <div style={{ background: 'var(--sbg)', color: 'var(--fg)', padding: 16 }}>
          <StatusPill status="soon" />
          <p className="t-caption" style={{ marginTop: 12 }}>
            Leave in
          </p>
          <p className="t-display">8 min</p>
        </div>
        <div style={{ padding: 16 }}>
          <p className="t-strong">Coffee with Maya</p>
          <p className="t-caption muted">Starts 4:35 PM · 14 min drive · arrive 10 min early</p>
        </div>
      </div>
    </Card>
  );
}
