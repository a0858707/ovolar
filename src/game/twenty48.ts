export const GRID_SIZE = 4;

export type Board = number[][];
export type Direction = 'left' | 'right' | 'up' | 'down';

export interface MoveResult {
  board: Board;
  moved: boolean;
  scoreDelta: number;
  created2048: boolean;
}

export const emptyBoard = (): Board => Array.from({ length: GRID_SIZE }, () => Array<number>(GRID_SIZE).fill(0));
export const cloneBoard = (board: Board): Board => board.map((row) => [...row]);

const mergeLine = (line: number[]): { line: number[]; scoreDelta: number; created2048: boolean } => {
  const values = line.filter(Boolean);
  const result: number[] = [];
  let scoreDelta = 0;
  let created2048 = false;

  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === values[index + 1]) {
      const merged = values[index] * 2;
      result.push(merged);
      scoreDelta += merged;
      created2048 ||= merged === 2048;
      index += 1;
    } else {
      result.push(values[index]);
    }
  }

  return { line: [...result, ...Array<number>(GRID_SIZE - result.length).fill(0)], scoreDelta, created2048 };
};

const readLine = (board: Board, direction: Direction, index: number): number[] => {
  if (direction === 'left') return [...board[index]];
  if (direction === 'right') return [...board[index]].reverse();
  const column = board.map((row) => row[index]);
  return direction === 'up' ? column : column.reverse();
};

const writeLine = (board: Board, direction: Direction, index: number, line: number[]): void => {
  const values = direction === 'right' || direction === 'down' ? [...line].reverse() : line;
  if (direction === 'left' || direction === 'right') board[index] = values;
  else values.forEach((value, row) => { board[row][index] = value; });
};

export const moveBoard = (board: Board, direction: Direction): MoveResult => {
  const next = cloneBoard(board);
  let scoreDelta = 0;
  let created2048 = false;

  for (let index = 0; index < GRID_SIZE; index += 1) {
    const result = mergeLine(readLine(board, direction, index));
    writeLine(next, direction, index, result.line);
    scoreDelta += result.scoreDelta;
    created2048 ||= result.created2048;
  }

  const moved = next.some((row, rowIndex) => row.some((value, columnIndex) => value !== board[rowIndex][columnIndex]));
  return { board: next, moved, scoreDelta, created2048 };
};

export const spawnTile = (board: Board, random = Math.random): Board => {
  const emptyCells: Array<[number, number]> = [];
  board.forEach((row, y) => row.forEach((value, x) => { if (!value) emptyCells.push([x, y]); }));
  if (!emptyCells.length) return cloneBoard(board);
  const [x, y] = emptyCells[Math.floor(random() * emptyCells.length)];
  const next = cloneBoard(board);
  next[y][x] = random() < 0.9 ? 2 : 4;
  return next;
};

export const createStartingBoard = (random = Math.random): Board => spawnTile(spawnTile(emptyBoard(), random), random);

export const canMove = (board: Board): boolean => board.some((row, y) => row.some((value, x) => {
  if (!value) return true;
  return board[y + 1]?.[x] === value || row[x + 1] === value;
}));

/** Opens two low-value cells while retaining the run's most valuable progress. */
export const rescueBoard = (board: Board, cellsToClear = 2): Board => {
  const next = cloneBoard(board);
  const candidates = board.flatMap((row, y) => row.map((value, x) => ({ value, x, y })))
    .filter(({ value }) => value > 0)
    .sort((first, second) => first.value - second.value || first.y - second.y || first.x - second.x);
  candidates.slice(0, cellsToClear).forEach(({ x, y }) => { next[y][x] = 0; });
  return next;
};
