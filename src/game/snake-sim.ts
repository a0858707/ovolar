import { MAX_SNAKE_LIVES, START_ARENA, desiredObstacleCount, expandedArena, initialSnake, nextHead, safeRespawnSnake, spawnFood, spawnObstacle, stepSnake, type Arena, type Direction, type Point } from './snake.js';

const RUNS = 500;
const DIRECTIONS: Direction[] = ['left', 'right', 'up', 'down'];
const distance = (first: Point, second: Point, arena: Arena): number => {
  const dx = Math.min(Math.abs(first.x - second.x), arena.size - Math.abs(first.x - second.x));
  const dy = Math.min(Math.abs(first.y - second.y), arena.size - Math.abs(first.y - second.y));
  return dx + dy;
};
const percentile = (values: number[], ratio: number): number => values[Math.min(values.length - 1, Math.floor(values.length * ratio))] ?? 0;

let seed = 918273;
const random = (): number => ((seed = (seed * 48271) % 2147483647) / 2147483647);
const scores: number[] = []; const ticksByRun: number[] = []; let selfDeaths = 0; let obstacleDeaths = 0; let noMoveStates = 0;
let expansionOne = 0; let expansionTwo = 0; let expansionThree = 0; let expansionTotal = 0; let livesCollected = 0; let livesConsumed = 0; let densityAtDeath = 0;

for (let run = 0; run < RUNS; run += 1) {
  let arena = START_ARENA; let snake = initialSnake(arena); let obstacles: Point[] = []; let life: Point | undefined; let food = spawnFood(snake, arena, obstacles, undefined, random)!;
  let score = 0; let lives = 3; let ticks = 0; let nextLifeAt = 12 + Math.floor(random() * 7); let lifeExpires = 0; let expansions = 0;
  while (ticks < 900) {
    ticks += 1; if (life && ticks >= lifeExpires) life = undefined;
    const attempted = DIRECTIONS.map((candidate) => ({ candidate, result: stepSnake(snake, candidate, food, arena, obstacles) }));
    const options = attempted.filter(({ result }) => !result.collision);
    if (!options.length) { noMoveStates += 1; if (attempted.every(({ result }) => result.collision === 'obstacle')) obstacleDeaths += 1; else selfDeaths += 1; livesConsumed += 1; if (--lives <= 0) break; snake = safeRespawnSnake(arena, obstacles, food, life); continue; }
    const target = life ?? food;
    options.sort((first, second) => {
      const firstHead = nextHead(snake[0], first.candidate, arena); const secondHead = nextHead(snake[0], second.candidate, arena);
      const firstSpace = DIRECTIONS.filter((candidate) => !stepSnake(first.result.snake, candidate, food, arena, obstacles).collision).length;
      const secondSpace = DIRECTIONS.filter((candidate) => !stepSnake(second.result.snake, candidate, food, arena, obstacles).collision).length;
      return (secondSpace * 2 - distance(secondHead, target, arena)) - (firstSpace * 2 - distance(firstHead, target, arena));
    });
    const result = options[0]!.result;
    snake = result.snake;
    if (life && snake[0].x === life.x && snake[0].y === life.y) { if (lives < MAX_SNAKE_LIVES) { lives += 1; livesCollected += 1; } life = undefined; }
    if (result.ate) {
      score += 1;
      const expanded = expandedArena(arena, snake, food, obstacles, life, score); arena = expanded.arena; snake = expanded.snake; food = expanded.food; obstacles = expanded.obstacles; life = expanded.life;
      if (expanded.expanded) expansions += 1;
      while (obstacles.length < desiredObstacleCount(score, arena)) { const next = spawnObstacle(snake, food, life, arena, obstacles, random); if (next.length === obstacles.length) break; obstacles = next; }
      if (!life && lives < MAX_SNAKE_LIVES && score >= nextLifeAt) { life = spawnFood(snake, arena, obstacles, undefined, random); if (life) { lifeExpires = ticks + 115; nextLifeAt = score + 12 + Math.floor(random() * 7); } }
      const nextFood = spawnFood(snake, arena, obstacles, life, random);
      if (!nextFood) break;
      food = nextFood;
    }
    // Simulate collision handling after decisions rather than waiting for the next policy pass.
    const nextAttempts = DIRECTIONS.map((candidate) => stepSnake(snake, candidate, food, arena, obstacles));
    if (!nextAttempts.some((attempt) => !attempt.collision)) { noMoveStates += 1; if (nextAttempts.every((attempt) => attempt.collision === 'obstacle')) obstacleDeaths += 1; else selfDeaths += 1; livesConsumed += 1; if (--lives <= 0) break; snake = safeRespawnSnake(arena, obstacles, food, life); }
  }
  scores.push(score); ticksByRun.push(ticks); expansionTotal += expansions; if (expansions >= 1) expansionOne += 1; if (expansions >= 2) expansionTwo += 1; if (expansions >= 3) expansionThree += 1; densityAtDeath += obstacles.length / (arena.size * arena.size);
}
scores.sort((first, second) => first - second);
const report = {
  runs: RUNS, averageScore: Number((scores.reduce((sum, score) => sum + score, 0) / RUNS).toFixed(2)), median: percentile(scores, .5), p90: percentile(scores, .9), max: scores.at(-1),
  averageTicks: Number((ticksByRun.reduce((sum, ticks) => sum + ticks, 0) / RUNS).toFixed(1)), deaths: { self: selfDeaths, obstacle: obstacleDeaths },
  expansionReach: { one: Number((expansionOne / RUNS * 100).toFixed(1)), two: Number((expansionTwo / RUNS * 100).toFixed(1)), three: Number((expansionThree / RUNS * 100).toFixed(1)), average: Number((expansionTotal / RUNS).toFixed(2)) },
  averageLivesCollected: Number((livesCollected / RUNS).toFixed(2)), averageLivesConsumed: Number((livesConsumed / RUNS).toFixed(2)), obstacleDensityAtDeath: Number((densityAtDeath / RUNS * 100).toFixed(2)), impossibleStates: noMoveStates,
};
console.log(JSON.stringify(report, null, 2));
