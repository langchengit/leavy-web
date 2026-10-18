import type { CalEvent } from '../types';

// Calendar links ("secret iCal address" in Google, "Public Calendar" share link in iCloud).

/** Accepts https:// and webcal:// links; returns a fetchable https URL or null. */
export function normalizeFeedUrl(raw: string): string | null {
  let url = raw.trim();
  if (/^webcals?:\/\//i.test(url)) url = url.replace(/^webcals?:\/\//i, 'https://');
  if (!/^https?:\/\//i.test(url)) return null;
  try {
    new URL(url);
  } catch {
    return null;
  }
  return url;
}

export function feedLabel(url: string): string {
  if (/google\.com/i.test(url)) return 'Google Calendar';
  if (/icloud\.com/i.test(url)) return 'iCloud Calendar';
  if (/outlook\.(com|office)/i.test(url)) return 'Outlook Calendar';
  try {
    return new URL(url).host;
  } catch {
    return 'Calendar link';
  }
}

/** Shows enough to recognise a link without displaying the secret part. */
export function maskFeedUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.host}/…${u.pathname.slice(-10)}`;
  } catch {
    return '…';
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Browsers can't fetch these links directly (Google and iCloud send no CORS headers), so they go
 * through the ics-proxy Supabase function. The link is sent in the body, not the URL.
 */
function fetchFeed(url: string): Promise<Response> {
  if (!supabaseUrl || !supabaseKey) {
    return Promise.reject(new Error('Browsers block calendar links without Leavy’s calendar proxy. Add the Supabase keys and deploy ics-proxy (docs/SETUP.md).'));
  }
  return fetch(`${supabaseUrl}/functions/v1/ics-proxy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: supabaseKey },
    body: JSON.stringify({ url }),
  });
}

// Calendar files can be large; don't re-download on every 5-minute refresh.
const CACHE_MS = 10 * 60_000;
const cache = new Map<string, { at: number; text: string }>();

export async function fetchFeedEvents(url: string, from: Date, to: Date): Promise<CalEvent[]> {
  const hit = cache.get(url);
  let text = hit && Date.now() - hit.at < CACHE_MS ? hit.text : null;

  if (!text) {
    let res: Response;
    try {
      res = await fetchFeed(url);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('Browsers')) throw e;
      throw new Error('Couldn’t load this link through Leavy’s calendar proxy. Check that the ics-proxy function is deployed (docs/SETUP.md).', { cause: e });
    }
    if (res.status === 404 || res.status === 403) throw new Error('This link no longer works. It may have been reset; copy it again.');
    if (res.status === 400) throw new Error('That isn’t a calendar link this app can load.');
    if (!res.ok) throw new Error(`Couldn’t load this calendar (error ${res.status}).`);
    text = await res.text();
    if (!text.includes('BEGIN:VCALENDAR')) throw new Error('That link isn’t a calendar link. Copy the iCal address instead.');
    cache.set(url, { at: Date.now(), text });
  }

  // The iCal parser is large, so it's only downloaded once someone has a calendar link.
  const { parseIcs } = await import('./ics');
  return parseIcs(text, from, to, feedLabel(url));
}

export function forgetFeed(url: string) {
  cache.delete(url);
}
