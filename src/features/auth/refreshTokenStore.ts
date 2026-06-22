const memoryRefreshTokenRef: { current: string | null } = { current: null };

export function setMemoryRefreshToken(token: string | null) {
  memoryRefreshTokenRef.current = token;
}

export function getMemoryRefreshToken(): string | null {
  return memoryRefreshTokenRef.current;
}
