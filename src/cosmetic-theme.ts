import { haptic } from './feedback';

type Palette = 'aubergine-lime' | 'olive-milk' | 'indigo-apricot' | 'chocolate-ice-blue' | 'cranberry-pistachio';
const TOKENS = ['bg', 'surface', 'raised', 'border', 'text', 'muted', 'accent', 'accent-ink'] as const;
const SHAKE_DELTA = 18;
const SHAKE_COOLDOWN = 2500;

export const createCosmeticTheme = (button: HTMLButtonElement, defaultTheme: Palette, onUnlock: (message: string) => void) => {
  const palettes: Palette[] = [defaultTheme, 'aubergine-lime', 'olive-milk', 'indigo-apricot', 'chocolate-ice-blue'].filter((theme, index, list) => list.indexOf(theme) === index) as Palette[];
  let index = 0; let themesUnlocked = false; let shakeUnlocked = false; let lastMagnitude = 0; let lastChange = 0;
  const nativeMobile = (): boolean => Boolean((window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() && matchMedia('(pointer: coarse)').matches);
  const apply = (): void => TOKENS.forEach((token) => document.body.style.setProperty(`--theme-${token}`, `var(--palette-${palettes[index]}-${token})`));
  const resetPalette = (): void => { TOKENS.forEach((token) => document.body.style.removeProperty(`--theme-${token}`)); index = 0; };
  const cycle = (): void => { if (!themesUnlocked) return; index = (index + 1) % palettes.length; apply(); lastChange = Date.now(); haptic('confirm'); };
  const motion = (event: DeviceMotionEvent): void => { if (!shakeUnlocked) return; const a = event.accelerationIncludingGravity; if (!a || a.x === null || a.y === null || a.z === null) return; const magnitude = Math.hypot(a.x, a.y, a.z); const now = Date.now(); if (lastMagnitude && Math.abs(magnitude - lastMagnitude) >= SHAKE_DELTA && now - lastChange >= SHAKE_COOLDOWN) cycle(); lastMagnitude = magnitude; };
  const stopShake = (): void => { window.removeEventListener('devicemotion', motion); lastMagnitude = 0; };
  button.addEventListener('click', cycle);
  return {
    unlockThemes: (): void => { if (themesUnlocked) return; themesUnlocked = true; button.hidden = false; button.classList.remove('is-revealed'); void button.offsetWidth; button.classList.add('is-revealed'); haptic('success'); onUnlock('THEMES UNLOCKED'); },
    unlockShake: (): void => { if (shakeUnlocked) return; shakeUnlocked = true; if (nativeMobile()) window.addEventListener('devicemotion', motion); haptic('success'); onUnlock('SHAKE MODE UNLOCKED'); },
    resetRun: (): void => { stopShake(); themesUnlocked = false; shakeUnlocked = false; button.hidden = true; resetPalette(); },
    restore: (themes: boolean, shake: boolean): void => { stopShake(); resetPalette(); themesUnlocked = themes; shakeUnlocked = shake; button.hidden = !themes; if (shake && nativeMobile()) window.addEventListener('devicemotion', motion); },
    finish: (): void => { stopShake(); button.hidden = true; },
  };
};
