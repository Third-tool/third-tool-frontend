import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'third:completedToday';

interface CompletedToday {
  date: string; // YYYY-MM-DD
  count: number;
}

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function read(): CompletedToday {
  if (typeof window === 'undefined') return { date: todayKey(), count: 0 };
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { date: todayKey(), count: 0 };
  try {
    const parsed = JSON.parse(raw) as Partial<CompletedToday>;
    const t = todayKey();
    if (parsed.date !== t || typeof parsed.count !== 'number') {
      return { date: t, count: 0 };
    }
    return { date: parsed.date, count: parsed.count };
  } catch {
    return { date: todayKey(), count: 0 };
  }
}

// Module-level cached snapshot — useSyncExternalStore requires referential
// stability when the underlying value is unchanged, otherwise React thrashes.
let snapshot: CompletedToday = read();
const listeners = new Set<() => void>();

function refresh(): void {
  const next = read();
  if (next.date === snapshot.date && next.count === snapshot.count) return;
  snapshot = next;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) refresh();
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }
  return () => {
    listeners.delete(cb);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage);
    }
  };
}

export function bumpCompletedToday(): number {
  if (typeof window === 'undefined') return snapshot.count;
  const current = read();
  const next: CompletedToday = { date: current.date, count: current.count + 1 };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  snapshot = next;
  listeners.forEach((l) => l());
  return next.count;
}

export function resetCompletedToday(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
  snapshot = { date: todayKey(), count: 0 };
  listeners.forEach((l) => l());
}

export function useCompletedToday(): CompletedToday {
  return useSyncExternalStore(subscribe, () => snapshot, () => snapshot);
}
