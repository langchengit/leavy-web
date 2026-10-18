import { useCallback, useEffect, useState } from 'react';

// Browser notification permission.

export type BrowserPermission = 'granted' | 'denied' | 'default' | 'unsupported';

export function notificationPermission(): BrowserPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return window.Notification.permission;
}

/** Shows the browser's prompt. Browsers only allow this from a click, so call it from onPress. */
export async function requestNotificationPermission(): Promise<BrowserPermission> {
  if (notificationPermission() === 'unsupported') return 'unsupported';
  try {
    return await window.Notification.requestPermission();
  } catch {
    return notificationPermission();
  }
}

/** The current permission, kept up to date when the user changes it in the browser's site settings. */
export function useNotificationPermission(): [BrowserPermission, () => Promise<BrowserPermission>] {
  const [permission, setPermission] = useState<BrowserPermission>(notificationPermission);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) return;
    let status: PermissionStatus | null = null;
    const onChange = () => setPermission(notificationPermission());
    navigator.permissions
      .query({ name: 'notifications' })
      .then((s) => {
        status = s;
        s.addEventListener('change', onChange);
      })
      .catch(() => {});
    return () => status?.removeEventListener('change', onChange);
  }, []);

  const request = useCallback(async () => {
    const next = await requestNotificationPermission();
    setPermission(next);
    return next;
  }, []);

  return [permission, request];
}
