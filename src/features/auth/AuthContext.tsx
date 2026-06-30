/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import { setMemoryRefreshToken } from './refreshTokenStore';

export interface AuthContextValue {
  refreshToken: string | null;
  setRefreshToken: (token: string | null) => void;
  clear: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [refreshToken, setRefreshTokenState] = useState<string | null>(null);

  const setRefreshToken = useCallback((token: string | null) => {
    setRefreshTokenState(token);
    setMemoryRefreshToken(token);
  }, []);

  const clear = useCallback(() => {
    setRefreshTokenState(null);
    setMemoryRefreshToken(null);
  }, []);

  const value = useMemo(
    () => ({ refreshToken, setRefreshToken, clear }),
    [refreshToken, setRefreshToken, clear],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
