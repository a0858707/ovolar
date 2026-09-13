export type Direction = 'left' | 'right' | 'up' | 'down';
export interface Point { x: number; y: number; }
export interface Arena { size: number; }
export interface SnakeStep { snake: Point[]; ate: boolean; collision?: 'self' | 'obstacle'; }

export const START_ARENA: Arena = { size: 14 };
export const ARENA_STAGES: readonly { score: number; size: number }[] = [
  { score: 10, size: 18 }, { score: 25, size: 22 }, { score: 45, size: 26 },
];
export const MAX_SNAKE_LIVES = 5;
export const samePoint = (first: Point, second: Point): boolean => first.x === second.x && first.y === second.y;
export const pointKey = ({ x, y }: Point): string => `${x},${y}`;
export const isOpposite = (first: Direction, second: Direction): boolean =>
  (first === 'left' && second === 'right') || (first === 'right' && second === 'left') || (first === 'up' && second === 'down') || (first === 'down' && second === 'up');
export const canQueueDirection = (current: Direction, queued: Direction, requested: Direction): boolean => queued === current && !isOpposite(current, requested);
export const initialSnake = (arena: Arena = START_ARENA): Point[] => {
  const middle = Math.floor(arena.size / 2);
  return [{ x: middle, y: middle }, { x: middle - 1, y: middle }, { x: middle - 2, y: middle }];
};

/** Toroidal movement: crossing any edge enters on the opposite edge. */
export const nextHead = (head: Point, direction: Direction, arena: Arena = START_ARENA): Point => {
  const delta = direction === 'left' ? [-1, 0] : direction === 'right' ? [1, 0] : direction === 'up' ? [0, -1] : [0, 1];
  return { x: (head.x + delta[0] + arena.size) % arena.size, y: (head.y + delta[1] + arena.size) % arena.size };
};
export const stepSnake = (snake: Point[], direction: Direction, food: Point, arena: Arena, obstacles: Point[] = []): SnakeStep => {
  const head = nextHead(snake[0], direction, arena); const ate = samePoint(head, food); const occupied = ate ? snake : snake.slice(0, -1);
  if (occupied.some((segment) => samePoint(segment, head))) return { snake, ate: false, collision: 'self' };
  if (obstacles.some((obstacle) => samePoint(obstacle, head))) return { snake, ate: false, collision: 'obstacle' };
  return { snake: ate ? [head, ...snake] : [head, ...snake.slice(0, -1)], ate };
};
const neighbors = (point: Point, arena: Arena): Point[] => [nextHead(point, 'left', arena), nextHead(point, 'right', arena), nextHead(point, 'up', arena), nextHead(point, 'down', arena)];
export const reachableCells = (start: Point, arena: Arena, blocked: Point[]): Set<string> => {
  const blockedKeys = new Set(blocked.map(pointKey)); const visited = new Set<string>(); const queue = [start];
  while (queue.length) { const point = queue.shift()!; const key = pointKey(point); if (visited.has(key) || blockedKeys.has(key)) continue; visited.add(key); neighbors(point, arena).forEach((next) => { if (!visited.has(pointKey(next))) queue.push(next); }); }
  return visited;
};
export const spawnEmptyPoint = (arena: Arena, occupied: Point[], random = Math.random, reachableFrom?: Point): Point | undefined => {
  const occupiedKeys = new Set(occupied.map(pointKey)); const reachable = reachableFrom ? reachableCells(reachableFrom, arena, occupied.filter((point) => !samePoint(point, reachableFrom))) : undefined; const empty: Point[] = [];
  for (let y = 0; y < arena.size; y += 1) for (let x = 0; x < arena.size; x += 1) { const point = { x, y }; if (!occupiedKeys.has(pointKey(point)) && (!reachable || reachable.has(pointKey(point)))) empty.push(point); }
  return empty.length ? empty[Math.floor(random() * empty.length)] : undefined;
};
export const spawnFood = (snake: Point[], arena: Arena, obstacles: Point[] = [], life?: Point, random = Math.random): Point | undefined => spawnEmptyPoint(arena, [...snake, ...obstacles, ...(life ? [life] : [])], random, snake[0]);
export const desiredObstacleCount = (score: number, arena: Arena): number => score < 5 ? 0 : Math.min(Math.floor(arena.size * arena.size * 0.055), 1 + Math.floor((score - 5) / 3));
const near = (first: Point, second: Point, arena: Arena): boolean => {
  const dx = Math.min(Math.abs(first.x - second.x), arena.size - Math.abs(first.x - second.x)); const dy = Math.min(Math.abs(first.y - second.y), arena.size - Math.abs(first.y - second.y)); return dx + dy <= 2;
};
/** Adds one safe, reachable single-cell obstacle without sealing off the active route. */
export const spawnObstacle = (snake: Point[], food: Point, life: Point | undefined, arena: Arena, obstacles: Point[], random = Math.random): Point[] => {
  const blocked = [...snake, food, ...obstacles, ...(life ? [life] : [])]; const candidates: Point[] = [];
  for (let y = 0; y < arena.size; y += 1) for (let x = 0; x < arena.size; x += 1) { const point = { x, y }; if (!blocked.some((item) => samePoint(item, point)) && !near(point, snake[0], arena)) candidates.push(point); }
  for (let attempt = 0; attempt < Math.min(candidates.length, 24); attempt += 1) { const candidate = candidates.splice(Math.floor(random() * candidates.length), 1)[0]!; const next = [...obstacles, candidate]; const reachable = reachableCells(snake[0], arena, [...snake.slice(1), ...next]); if (reachable.size >= arena.size * arena.size * 0.55 && reachable.has(pointKey(food))) return next; }
  return obstacles;
};
export const expandedArena = (arena: Arena, snake: Point[], food: Point, obstacles: Point[], life: Point | undefined, score: number): { arena: Arena; snake: Point[]; food: Point; obstacles: Point[]; life?: Point; expanded: boolean } => {
  const stage = ARENA_STAGES.find((item) => item.score === score && item.size > arena.size); if (!stage) return { arena, snake, food, obstacles, life, expanded: false };
  const offset = Math.floor((stage.size - arena.size) / 2); const shift = (point: Point): Point => ({ x: point.x + offset, y: point.y + offset });
  return { arena: { size: stage.size }, snake: snake.map(shift), food: shift(food), obstacles: obstacles.map(shift), life: life ? shift(life) : undefined, expanded: true };
};
/** Finds a centered three-cell horizontal spawn that leaves the next square clear. */
export const safeRespawnSnake = (arena: Arena, obstacles: Point[], food: Point, life?: Point): Point[] => {
  const blocked = new Set([...obstacles, food, ...(life ? [life] : [])].map(pointKey)); const middle = Math.floor(arena.size / 2);
  const candidates = Array.from({ length: arena.size * arena.size }, (_, index) => ({ x: index % arena.size, y: Math.floor(index / arena.size) })).sort((first, second) => Math.abs(first.x - middle) + Math.abs(first.y - middle) - Math.abs(second.x - middle) - Math.abs(second.y - middle));
  for (const head of candidates) { const candidate = [head, nextHead(head, 'left', arena), nextHead(nextHead(head, 'left', arena), 'left', arena)]; if (candidate.every((point) => !blocked.has(pointKey(point))) && !blocked.has(pointKey(nextHead(head, 'right', arena)))) return candidate; }
  return initialSnake(arena);
};
// Obstacles carry the challenge, so the top speed stays controllable on touch screens.
export const speedForScore = (score: number): number => Math.max(105, Math.round(110 + 125 * Math.exp(-score / 20)));
