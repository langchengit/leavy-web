import { AccountCard, CalendarLinks, ConnectedCalendars, DemoModeSwitch, MapsKeyStatus } from '../components/connections';
import { Panel, Section } from '../components/ui';
import { useTitle } from '../hooks';

/** Your account and where events come from: Google Calendar and private calendar links. */
export function ConnectionsPage() {
  useTitle('Connections');
  return (
    <div className="page">
      <div className="page-inner">
        <header className="page-header">
          <div className="stack g-xs">
            <h1 className="t-title">Connections</h1>
            <p className="muted">Your account and where your events come from.</p>
          </div>
        </header>
        <div className="columns">
          <div className="column">
            <Section title="Account">
              <AccountCard />
            </Section>
            <Section title="Connected calendars" description="Calendars Leavy reads with your permission.">
              <ConnectedCalendars />
            </Section>
            <Panel title="Demo">
              <DemoModeSwitch />
            </Panel>
            <Panel title="About">
              <MapsKeyStatus />
            </Panel>
          </div>
          <div className="column">
            <Section title="Calendar links" description="Private iCal links from Google Calendar, iCloud or Outlook.">
              <CalendarLinks />
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
