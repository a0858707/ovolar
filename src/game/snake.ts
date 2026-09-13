export const GRID_SIZE = 20;

export type Direction = 'left' | 'right' | 'up' | 'down';
export interface Point { x: number; y: number; }
export interface SnakeStep {
  snake: Point[];
  ate: boolean;
  collision?: 'wall' | 'self';
}

export const initialSnake = (): Point[] => [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];

export const isOpposite = (first: Direction, second: Direction): boolean =>
  (first === 'left' && second === 'right') || (first === 'right' && second === 'left') ||
  (first === 'up' && second === 'down') || (first === 'down' && second === 'up');

// Limit input to one turn before the next game tick, so a quick two-swipe cannot reverse direction.
export const canQueueDirection = (current: Direction, queued: Direction, requested: Direction): boolean =>
  queued === current && !isOpposite(current, requested);

export const nextHead = (head: Point, direction: Direction): Point => {
  if (direction === 'left') return { x: head.x - 1, y: head.y };
  if (direction === 'right') return { x: head.x + 1, y: head.y };
  return direction === 'up' ? { x: head.x, y: head.y - 1 } : { x: head.x, y: head.y + 1 };
};

const samePoint = (first: Point, second: Point): boolean => first.x === second.x && first.y === second.y;

export const spawnFood = (snake: Point[], random = Math.random): Point | undefined => {
  const empty: Point[] = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) empty.push({ x, y });
    }
  }
  return empty.length ? empty[Math.floor(random() * empty.length)] : undefined;
};

export const stepSnake = (snake: Point[], direction: Direction, food: Point): SnakeStep => {
  const head = nextHead(snake[0], direction);
  if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
    return { snake, ate: false, collision: 'wall' };
  }
  const ate = samePoint(head, food);
  const occupied = ate ? snake : snake.slice(0, -1);
  if (occupied.some((segment) => samePoint(segment, head))) {
    return { snake, ate: false, collision: 'self' };
  }
  return { snake: ate ? [head, ...snake] : [head, ...snake.slice(0, -1)], ate };
};

export const speedForScore = (score: number): number => Math.max(70, 155 - score * 5);
