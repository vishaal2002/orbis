import { useEffect, useState } from 'react';

/** Reactive `window.matchMedia` — re-renders when the query match flips. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => globalThis.matchMedia?.(query).matches ?? false,
  );

  useEffect(() => {
    const mql = globalThis.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
