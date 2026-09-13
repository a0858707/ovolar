export const PAIR_SYMBOLS = ['☾', '✦', '❋', '≈', '◇', '●', '▲', '✧'] as const;
export type PairSymbol = typeof PAIR_SYMBOLS[number];
export interface PairCard { id: number; symbol: PairSymbol; }

export const createPairDeck = (random: () => number = Math.random): PairCard[] => {
  const deck = [...PAIR_SYMBOLS, ...PAIR_SYMBOLS].map((symbol, id) => ({ id, symbol }));
  for (let index = deck.length - 1; index > 0; index -= 1) { const swap = Math.floor(random() * (index + 1)); [deck[index], deck[swap]] = [deck[swap], deck[index]]; }
  return deck;
};

export const allPairsMatched = (matched: ReadonlySet<number>): boolean => matched.size === PAIR_SYMBOLS.length * 2;
