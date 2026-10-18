import type { Trip } from '../types';
import { leaveAlerts } from './alerts';
import { notificationPermission } from './browserAlerts';

// Leave alerts. They are timers in the open tab, shown with the
// Notification API, so they only fire while a Leavy tab is open (it can be in the background).

const timers = new Map<string, ReturnType<typeof setTimeout>>();

/** Never prompts: browsers only allow the prompt from a click (see Preferences → Alerts). */
export async function ensureNotificationPermission(): Promise<boolean> {
  return notificationPermission() === 'granted';
}

/** Replaces every alert this tab scheduled with fresh ones for the given trips. */
export async function syncLeaveAlerts(trips: Trip[], headsUpMin: number): Promise<void> {
  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear();
  if (notificationPermission() !== 'granted') return;

  const now = Date.now();
  for (const alert of leaveAlerts(trips, headsUpMin, now)) {
    const timer = setTimeout(() => {
      timers.delete(alert.id);
      try {
        // `tag` makes the browser replace, not stack, a notification with the same id.
        const n = new window.Notification(alert.title, { body: alert.body, tag: alert.id, icon: '/favicon.ico' });
        n.onclick = () => {
          window.focus();
          n.close();
        };
      } catch (e) {
        console.warn('Notification failed', e);
      }
    }, alert.at - now);
    timers.set(alert.id, timer);
  }
}
