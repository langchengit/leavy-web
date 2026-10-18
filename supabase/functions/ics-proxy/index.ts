// Fetches a private calendar link (.ics) for the web app. Browsers can't load these links
// directly because Google and iCloud don't send CORS headers; phones fetch them without this.
//
// Deploy: supabase functions deploy ics-proxy --no-verify-jwt
// The link is a secret, so it comes in a POST body (not the URL) and is never logged or stored.

const MAX_BYTES = 5_000_000;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
};

function reply(status: number, body: string, contentType = 'text/plain; charset=utf-8') {
  return new Response(body, { status, headers: { ...CORS, 'Content-Type': contentType } });
}

/** Only public https hosts: no IP addresses, localhost or internal names. */
function allowedUrl(raw: unknown): URL | null {
  if (typeof raw !== 'string') return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password) return null;
  if (!host.includes('.') || host.endsWith('.local') || host.endsWith('.internal') || host === 'localhost') return null;
  if (/^[\d.]+$/.test(host) || host.includes(':') || host.startsWith('[')) return null;
  return url;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return reply(405, 'Use POST.');

  const body = await req.json().catch(() => null);
  const url = allowedUrl(body?.url);
  if (!url) return reply(400, 'That isn’t a calendar link this app can load.');

  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: 'text/calendar, */*' }, redirect: 'follow', signal: AbortSignal.timeout(15_000) });
  } catch {
    return reply(502, 'Couldn’t reach this link.');
  }
  // A redirect could land somewhere this function wouldn't fetch directly.
  if (!allowedUrl(res.url)) return reply(400, 'That isn’t a calendar link this app can load.');
  if (!res.ok) return reply(res.status === 404 || res.status === 403 ? res.status : 502, `Calendar error ${res.status}.`);

  const length = Number(res.headers.get('content-length') ?? 0);
  if (length > MAX_BYTES) return reply(413, 'This calendar is too large.');
  const text = await res.text();
  if (text.length > MAX_BYTES) return reply(413, 'This calendar is too large.');
  if (!text.includes('BEGIN:VCALENDAR')) return reply(422, 'That link isn’t a calendar link.');

  return reply(200, text, 'text/calendar; charset=utf-8');
});
