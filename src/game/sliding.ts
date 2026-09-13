export const SLIDING_SIZE = 4;
export type SlidingBoard = Array<number | null>;

export const solvedBoard = (): SlidingBoard => [...Array.from({ length: 15 }, (_, index) => index + 1), null];

export const isSolved = (board: SlidingBoard): boolean => board.every((tile, index) => tile === (index === 15 ? null : index + 1));

export const areAdjacent = (first: number, second: number): boolean => {
  const firstRow = Math.floor(first / SLIDING_SIZE);
  const secondRow = Math.floor(second / SLIDING_SIZE);
  return Math.abs(first - second) === 1 && firstRow === secondRow || Math.abs(first - second) === SLIDING_SIZE;
};

export const moveTile = (board: SlidingBoard, tileIndex: number): SlidingBoard | undefined => {
  const emptyIndex = board.indexOf(null);
  if (emptyIndex < 0 || !areAdjacent(tileIndex, emptyIndex)) return undefined;
  const next = [...board];
  [next[tileIndex], next[emptyIndex]] = [next[emptyIndex], next[tileIndex]];
  return next;
};

/** Random legal moves from the solved board guarantee solvability without parity math. */
export const shuffledBoard = (random = Math.random, moves = 180): SlidingBoard => {
  let board = solvedBoard();
  let previousEmpty = -1;
  for (let step = 0; step < moves; step += 1) {
    const empty = board.indexOf(null);
    const candidates = [empty - 1, empty + 1, empty - SLIDING_SIZE, empty + SLIDING_SIZE]
      .filter((index) => index >= 0 && index < board.length && areAdjacent(index, empty) && index !== previousEmpty);
    const tile = candidates[Math.floor(random() * candidates.length)]!;
    previousEmpty = empty;
    board = moveTile(board, tile)!;
  }
  return isSolved(board) ? moveTile(board, 14)! : board;
};
