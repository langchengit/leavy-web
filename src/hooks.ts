import { useEffect, useState } from 'react';

/** Current time in ms, re-rendering every `intervalMs` so countdowns stay live. */
export function useNow(intervalMs = 15_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Laptop width: trips open beside the list instead of on their own page. Matches the CSS breakpoint. */
export function useWide(): boolean {
  return useMediaQuery('(min-width: 1100px)');
}

/** Phone width. Matches the CSS breakpoint. */
export function useCompact(): boolean {
  return useMediaQuery('(max-width: 719px)');
}

/** Sets the browser tab title. */
export function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · Leavy`;
  }, [title]);
}
