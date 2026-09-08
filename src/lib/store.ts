import { useEffect, useState } from 'react';

/** Everything about the child stays on this device. No account, nothing sent.
 *  See PRIVACY.md before changing that. */
export function useLocal<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    try { const s = localStorage.getItem('sk.' + key); return s ? JSON.parse(s) as T : initial; }
    catch { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem('sk.' + key, JSON.stringify(v)); } catch { /* private mode */ }
  }, [key, v]);
  return [v, setV] as const;
}
