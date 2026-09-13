export type FeedbackIntent = 'confirm' | 'success' | 'impact';

const patterns: Record<FeedbackIntent, number | number[]> = {
  confirm: 10,
  success: [10, 35, 16],
  impact: 22,
};

/** A deliberately small, best-effort haptic cue. Unsupported browsers simply ignore it. */
export const haptic = (intent: FeedbackIntent): void => {
  try {
    if (matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    navigator.vibrate?.(patterns[intent]);
  } catch { /* Haptics are optional. */ }
};
