import { MAX_SNAKE_LIVES, START_ARENA, canQueueDirection, desiredObstacleCount, expandedArena, initialSnake, safeRespawnSnake, spawnFood, spawnObstacle, speedForScore, stepSnake, type Arena, type Direction, type Point } from './game/snake';
import { haptic } from './feedback';
import { pauseWhenBackgrounded, readStoredNumber, renderLives, storageKey, writeStoredNumber } from './platform';

const BEST_KEY = storageKey('snake', 'best');
const SWIPE_DISTANCE = 24;
const LIFE_INTERVAL_MIN = 12;
const boardElement = document.querySelector<HTMLElement>('#snake-board')!;
const scoreElement = document.querySelector<HTMLOutputElement>('#snake-score')!;
const bestElement = document.querySelector<HTMLOutputElement>('#snake-best')!;
const overlay = document.querySelector<HTMLElement>('#snake-overlay')!;
const overlayTitle = document.querySelector<HTMLElement>('#snake-overlay-title')!;
const overlayText = document.querySelector<HTMLElement>('#snake-overlay-text')!;
const resumeButton = document.querySelector<HTMLButtonElement>('#snake-resume')!;
const pauseButton = document.querySelector<HTMLButtonElement>('#snake-pause')!;
const livesElement = document.querySelector<HTMLElement>('#snake-lives')!;
const eventElement = document.querySelector<HTMLElement>('#snake-event')!;
const themeButton = document.querySelector<HTMLButtonElement>('#snake-theme')!;
const SNAKE_THEMES = ['cranberry-pistachio', 'aubergine-lime', 'indigo-apricot', 'chocolate-ice-blue'] as const;
const THEME_TOKEN_NAMES = ['bg', 'surface', 'raised', 'border', 'text', 'muted', 'accent', 'accent-ink'] as const;
const SHAKE_DELTA_THRESHOLD = 18;
const SHAKE_COOLDOWN_MS = 2500;
type SnakeTheme = typeof SNAKE_THEMES[number];

let arena: Arena = START_ARENA; let snake = initialSnake(arena); let obstacles: Point[] = []; let life: Point | undefined;
let food = spawnFood(snake, arena, obstacles)!; let direction: Direction = 'right'; let queuedDirection: Direction = 'right';
let score = 0; let best = readStoredNumber(BEST_KEY); let gameOver = false; let paused = false; let timer: number | undefined;
let lives = 3; let ticks = 0; let lifeExpiresAt = 0; let nextLifeAt = 12; let eventTimer: number | undefined;
let expansionCount = 0; let themeUnlocked = false; let shakeUnlocked = false; let themeIndex = 0; let lastShakeMagnitude = 0; let lastThemeShiftAt = 0;
const showEvent = (message: string): void => { eventElement.textContent = message; eventElement.hidden = false; if (eventTimer) window.clearTimeout(eventTimer); eventTimer = window.setTimeout(() => { eventElement.hidden = true; }, 1150); };
const saveBest = (): void => { if (score > best) { best = score; writeStoredNumber(BEST_KEY, best); } };
const stopTimer = (): void => { if (timer) window.clearInterval(timer); timer = undefined; };
const startTimer = (): void => { stopTimer(); if (!paused && !gameOver) timer = window.setInterval(tick, speedForScore(score)); };
const showOverlay = (title: string, text: string, canResume: boolean): void => { overlay.hidden = false; overlayTitle.textContent = title; overlayText.textContent = text; resumeButton.hidden = !canResume; };
const hideOverlay = (): void => { overlay.hidden = true; };

const setSnakeTheme = (theme: SnakeTheme): void => {
  THEME_TOKEN_NAMES.forEach((token) => document.body.style.setProperty(`--theme-${token}`, `var(--palette-${theme}-${token})`));
};
const resetSnakeTheme = (): void => {
  THEME_TOKEN_NAMES.forEach((token) => document.body.style.removeProperty(`--theme-${token}`));
  themeIndex = 0;
};
const revealThemeButton = (): void => {
  themeButton.hidden = false;
  themeButton.disabled = false;
  themeButton.classList.remove('is-revealed');
  void themeButton.offsetWidth;
  themeButton.classList.add('is-revealed');
};
const hideThemeButton = (): void => { themeButton.hidden = true; themeButton.disabled = true; themeButton.classList.remove('is-revealed'); };
const cycleTheme = (): void => {
  if (!themeUnlocked || gameOver) return;
  themeIndex = (themeIndex + 1) % SNAKE_THEMES.length;
  setSnakeTheme(SNAKE_THEMES[themeIndex]);
  lastThemeShiftAt = Date.now();
  haptic('confirm');
};
const isNativeMobile = (): boolean => {
  const capacitor = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(capacitor?.isNativePlatform?.() && window.matchMedia('(pointer: coarse)').matches);
};
const handleShake = (event: DeviceMotionEvent): void => {
  if (!shakeUnlocked || !themeUnlocked || gameOver || paused) return;
  const acceleration = event.accelerationIncludingGravity;
  if (acceleration?.x === null || acceleration?.y === null || acceleration?.z === null || !acceleration) return;
  const magnitude = Math.hypot(acceleration.x, acceleration.y, acceleration.z);
  const now = Date.now();
  if (lastShakeMagnitude && Math.abs(magnitude - lastShakeMagnitude) >= SHAKE_DELTA_THRESHOLD && now - lastThemeShiftAt >= SHAKE_COOLDOWN_MS) cycleTheme();
  lastShakeMagnitude = magnitude;
};
const enableShake = (): void => { if (isNativeMobile()) window.addEventListener('devicemotion', handleShake); };
const disableShake = (): void => { window.removeEventListener('devicemotion', handleShake); lastShakeMagnitude = 0; };
const handleExpansionUnlocks = (): void => {
  expansionCount += 1;
  if (expansionCount === 1) { themeUnlocked = true; revealThemeButton(); haptic('success'); showEvent('THEME SHIFT UNLOCKED'); return; }
  if (expansionCount === 2) { shakeUnlocked = true; enableShake(); haptic('success'); showEvent('SHAKE MODE UNLOCKED'); return; }
  showEvent('ARENA EXPANDED');
};

function render(): void {
  const body = new Set(snake.map(({ x, y }) => `${x},${y}`)); const obstacleSet = new Set(obstacles.map(({ x, y }) => `${x},${y}`)); const head = snake[0];
  boardElement.style.gridTemplateColumns = `repeat(${arena.size}, 1fr)`; boardElement.style.gridTemplateRows = `repeat(${arena.size}, 1fr)`;
  boardElement.replaceChildren(...Array.from({ length: arena.size * arena.size }, (_, index) => {
    const point = { x: index % arena.size, y: Math.floor(index / arena.size) }; const cell = document.createElement('span'); cell.className = 'snake-cell';
    if (head.x === point.x && head.y === point.y) cell.classList.add('snake-head'); else if (body.has(`${point.x},${point.y}`)) cell.classList.add('snake-body'); else if (obstacleSet.has(`${point.x},${point.y}`)) cell.classList.add('snake-obstacle'); else if (food.x === point.x && food.y === point.y) cell.classList.add('snake-food'); else if (life?.x === point.x && life?.y === point.y) cell.classList.add('snake-life');
    return cell;
  }));
  scoreElement.value = String(score); bestElement.value = String(best); renderLives(livesElement, lives, MAX_SNAKE_LIVES);
}
function pause(): void { if (paused || gameOver) return; paused = true; stopTimer(); pauseButton.textContent = '▶'; pauseButton.setAttribute('aria-label', 'Resume game'); showOverlay('Paused.', 'Your run is waiting.', true); }
function resume(): void { if (!paused || gameOver) return; paused = false; pauseButton.textContent = 'Ⅱ'; pauseButton.setAttribute('aria-label', 'Pause game'); hideOverlay(); startTimer(); }
function respawnAfterLifeLoss(): void { snake = safeRespawnSnake(arena, obstacles, food, life); direction = 'right'; queuedDirection = 'right'; paused = true; pauseButton.textContent = '▶'; pauseButton.setAttribute('aria-label', 'Resume game'); showOverlay('Life saved.', 'Arena and score preserved.', true); showEvent('LIFE LOST'); render(); }
function eatFood(): void {
  score += 1; saveBest(); haptic('confirm');
  const expanded = expandedArena(arena, snake, food, obstacles, life, score); arena = expanded.arena; snake = expanded.snake; food = expanded.food; obstacles = expanded.obstacles; life = expanded.life;
  if (expanded.expanded) handleExpansionUnlocks();
  while (obstacles.length < desiredObstacleCount(score, arena)) { const next = spawnObstacle(snake, food, life, arena, obstacles); if (next.length === obstacles.length) break; obstacles = next; }
  if (!life && lives < MAX_SNAKE_LIVES && score >= nextLifeAt) { life = spawnFood(snake, arena, obstacles); if (life) { lifeExpiresAt = ticks + 115; nextLifeAt = score + LIFE_INTERVAL_MIN + Math.floor(Math.random() * 7); } }
  const nextFood = spawnFood(snake, arena, obstacles, life);
  if (!nextFood) { gameOver = true; disableShake(); hideThemeButton(); stopTimer(); showOverlay('Arena cleared.', 'A perfect run.', false); return; }
  food = nextFood; startTimer();
}
function tick(): void {
  direction = queuedDirection; ticks += 1; if (life && ticks >= lifeExpiresAt) life = undefined;
  const result = stepSnake(snake, direction, food, arena, obstacles);
  if (result.collision) { stopTimer(); haptic('impact'); if (lives > 1) { lives -= 1; respawnAfterLifeLoss(); } else { lives = 0; gameOver = true; disableShake(); hideThemeButton(); saveBest(); showOverlay('Run over.', result.collision === 'obstacle' ? 'An obstacle stopped the run.' : 'You ran into yourself.', false); render(); } return; }
  snake = result.snake;
  if (life && snake[0].x === life.x && snake[0].y === life.y) { if (lives < MAX_SNAKE_LIVES) { lives += 1; haptic('success'); showEvent('+1 LIFE'); } life = undefined; }
  if (result.ate) eatFood(); render();
}
function requestDirection(next: Direction): void { if (!gameOver && !paused && canQueueDirection(direction, queuedDirection, next)) queuedDirection = next; }
function restart(): void { stopTimer(); disableShake(); resetSnakeTheme(); hideThemeButton(); arena = START_ARENA; snake = initialSnake(arena); obstacles = []; life = undefined; food = spawnFood(snake, arena, obstacles)!; direction = 'right'; queuedDirection = 'right'; score = 0; lives = 3; ticks = 0; nextLifeAt = 12 + Math.floor(Math.random() * 7); expansionCount = 0; themeUnlocked = false; shakeUnlocked = false; gameOver = false; paused = false; pauseButton.textContent = 'Ⅱ'; pauseButton.setAttribute('aria-label', 'Pause game'); hideOverlay(); render(); startTimer(); }
document.querySelectorAll<HTMLButtonElement>('[data-snake-restart]').forEach((button) => button.addEventListener('click', restart)); resumeButton.addEventListener('click', resume); pauseButton.addEventListener('click', () => { if (paused) resume(); else pause(); }); themeButton.addEventListener('click', cycleTheme);
window.addEventListener('keydown', (event) => { const keys: Record<string, Direction | undefined> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down', A: 'left', D: 'right', W: 'up', S: 'down' }; if (keys[event.key]) { event.preventDefault(); requestDirection(keys[event.key]!); } });
let swipeStart: { x: number; y: number; pointerId: number } | undefined;
boardElement.addEventListener('pointerdown', (event) => { if (event.pointerType !== 'touch') return; event.preventDefault(); boardElement.setPointerCapture(event.pointerId); swipeStart = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }; }, { passive: false });
boardElement.addEventListener('pointermove', (event) => { if (swipeStart) event.preventDefault(); }, { passive: false });
boardElement.addEventListener('pointerup', (event) => { if (!swipeStart || event.pointerId !== swipeStart.pointerId) return; event.preventDefault(); const dx = event.clientX - swipeStart.x; const dy = event.clientY - swipeStart.y; swipeStart = undefined; if (Math.max(Math.abs(dx), Math.abs(dy)) >= SWIPE_DISTANCE) requestDirection(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down')); }, { passive: false });
boardElement.addEventListener('pointercancel', () => { swipeStart = undefined; }); pauseWhenBackgrounded(pause);
restart();
