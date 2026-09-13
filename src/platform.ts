export type GameId = 'block' | '2048' | 'snake' | 'sliding' | 'pairs';
export const MAX_LIVES = 3;

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

export const livesMarkup = (id: string): string => `<div class="lives-card"><span class="label">Lives</span><span id="${id}" class="life-pips" aria-label="3 lives remaining"></span></div>`;

export const renderLives = (element: HTMLElement, lives: number, maximum = MAX_LIVES): void => {
  element.replaceChildren(...Array.from({ length: maximum }, (_, index) => {
    const pip = document.createElement('i');
    pip.className = `life-pip${index < lives ? ' is-active' : ''}`;
    pip.setAttribute('aria-hidden', 'true');
    return pip;
  }));
  element.setAttribute('aria-label', `${lives} ${lives === 1 ? 'life' : 'lives'} remaining`);
};
