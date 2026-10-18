import { Bell, CircleAlert, CircleCheck } from 'lucide-react';

import { AlertsControl, GraceDefaultControl, LeaveTimeStyleControl, LookAheadControl, ModePicker } from '../components/controls';
import { Button, Panel } from '../components/ui';
import { useTitle } from '../hooks';
import { useNotificationPermission, type BrowserPermission } from '../lib/browserAlerts';
import { useSettings } from '../lib/settings';
import { useTrips } from '../lib/trips';

/** How leave times are worked out: grace period, travel mode, alerts, how far ahead to look. */
export function PreferencesPage() {
  useTitle('Preferences');
  const { settings, update } = useSettings();
  const { refresh } = useTrips();
  const [permission, requestPermission] = useNotificationPermission();

  // Ask from the click that turned alerts on, then reschedule so the new permission takes effect.
  const allowNotifications = async () => {
    if ((await requestPermission()) === 'granted') refresh();
  };

  return (
    <div className="page">
      <div className="page-inner">
        <header className="page-header">
          <div className="stack g-xs">
            <h1 className="t-title">Preferences</h1>
            <p className="muted">How Leavy works out your leave times. These apply to every event unless you change one.</p>
          </div>
        </header>
        <div className="columns">
          <div className="column">
            <Panel title="Arrive early by">
              <GraceDefaultControl />
            </Panel>
            <Panel title="Show leave time as">
              <LeaveTimeStyleControl />
            </Panel>
            <Panel title="Look ahead" description="How far ahead to look for events.">
              <LookAheadControl />
            </Panel>
          </div>
          <div className="column">
            <Panel title="Usually getting there by">
              <ModePicker value={settings.defaultMode} onChange={(defaultMode) => update({ defaultMode })} />
            </Panel>
            <Panel title="Alerts">
              <AlertsControl onEnable={() => permission === 'default' && allowNotifications()} />
              {settings.notifications ? <BrowserPermissionNote permission={permission} onAllow={allowNotifications} /> : null}
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrowserPermissionNote({ permission, onAllow }: { permission: BrowserPermission; onAllow: () => void }) {
  if (permission === 'default') {
    return (
      <div className="stack g-sm">
        <p className="t-caption muted">Your browser needs your OK before Leavy can show alerts.</p>
        <Button icon={Bell} label="Allow browser notifications" onClick={onAllow} />
      </div>
    );
  }
  const granted = permission === 'granted';
  const text = granted
    ? 'Browser notifications are on. They arrive while a Leavy tab is open, even in the background.'
    : permission === 'denied'
      ? 'This browser blocks notifications from Leavy. Allow them in the site settings next to the address bar.'
      : 'This browser can’t show notifications. Use the phone app for leave alerts.';
  const Icon = granted ? CircleCheck : CircleAlert;
  return (
    <div className="row g-sm" style={{ alignItems: 'flex-start' }}>
      <Icon size={18} color={granted ? 'var(--primary)' : 'var(--late-fg)'} aria-hidden style={{ marginTop: 1, flexShrink: 0 }} />
      <p className="t-caption muted">{text}</p>
    </div>
  );
}
