export type GameId = 'block' | '2048' | 'snake';

export const storageKey = (gameId: GameId, key: string): string => `ovolar.${gameId}.${key}`;

export const readStoredNumber = (key: string): number => {
  try { return Number.parseInt(localStorage.getItem(key) ?? '0', 10) || 0; } catch { return 0; }
};

export const writeStoredNumber = (key: string, value: number): void => {
  try { localStorage.setItem(key, String(value)); } catch { /* Local play continues when storage is unavailable. */ }
};

export const goHome = (): void => {
  window.location.hash = '#/';
};

/** Standard lifecycle hook for timer-based games. Returns its cleanup function. */
export const pauseWhenBackgrounded = (pause: () => void): (() => void) => {
  const onVisibility = (): void => { if (document.hidden) pause(); };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('blur', pause);
  window.addEventListener('ovolar-background', pause);
  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('blur', pause);
    window.removeEventListener('ovolar-background', pause);
  };
};
