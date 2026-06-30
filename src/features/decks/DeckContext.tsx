/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'third:selectedDeckId';

interface DeckContextValue {
  selectedDeckId: string | null;
  setSelectedDeckId: (id: string | null) => void;
}

const DeckContext = createContext<DeckContextValue | null>(null);

export function DeckProvider({ children }: { children: ReactNode }) {
  const [selectedDeckId, setSelectedDeckIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(STORAGE_KEY);
  });

  const setSelectedDeckId = useCallback((id: string | null) => {
    setSelectedDeckIdState(id);
    if (typeof window !== 'undefined') {
      if (id) window.localStorage.setItem(STORAGE_KEY, id);
      else window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSelectedDeckIdState(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(
    () => ({ selectedDeckId, setSelectedDeckId }),
    [selectedDeckId, setSelectedDeckId],
  );

  return <DeckContext.Provider value={value}>{children}</DeckContext.Provider>;
}

export function useSelectedDeck() {
  const ctx = useContext(DeckContext);
  if (!ctx) throw new Error('useSelectedDeck must be used inside <DeckProvider>');
  return ctx;
}
