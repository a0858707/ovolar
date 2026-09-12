export const TETROMINO_KINDS = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'] as const;

export type PieceKind = typeof TETROMINO_KINDS[number];

/** Returns one shuffled set of all seven tetrominoes. */
export const createShuffledBag = (random: () => number = Math.random): PieceKind[] => {
  const bag = [...TETROMINO_KINDS];
  for (let index = bag.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [bag[index], bag[swapIndex]] = [bag[swapIndex], bag[index]];
  }
  return bag;
};
