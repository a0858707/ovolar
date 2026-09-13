import {
  GRID_SIZE,
  canQueueDirection,
  initialSnake,
  spawnFood,
  speedForScore,
  stepSnake,
  type Direction,
} from './game/snake';
import { haptic } from './feedback';
import { MAX_LIVES, pauseWhenBackgrounded, readStoredNumber, renderLives, storageKey, writeStoredNumber } from './platform';

const BEST_KEY = storageKey('snake', 'best');
const SWIPE_DISTANCE = 24;

const boardElement = document.querySelector<HTMLElement>('#snake-board')!;
const scoreElement = document.querySelector<HTMLOutputElement>('#snake-score')!;
const bestElement = document.querySelector<HTMLOutputElement>('#snake-best')!;
const overlay = document.querySelector<HTMLElement>('#snake-overlay')!;
const overlayTitle = document.querySelector<HTMLElement>('#snake-overlay-title')!;
const overlayText = document.querySelector<HTMLElement>('#snake-overlay-text')!;
const resumeButton = document.querySelector<HTMLButtonElement>('#snake-resume')!;
const pauseButton = document.querySelector<HTMLButtonElement>('#snake-pause')!;
const livesElement = document.querySelector<HTMLElement>('#snake-lives')!;

let snake = initialSnake();
let food = spawnFood(snake)!;
let direction: Direction = 'right';
let queuedDirection: Direction = 'right';
let score = 0;
let best = readBest();
let gameOver = false;
let paused = false;
let timer: number | undefined;
let lives = MAX_LIVES;

function readBest(): number { return readStoredNumber(BEST_KEY); }

function saveBest(): void {
  if (score <= best) return;
  best = score;
  writeStoredNumber(BEST_KEY, best);
}

function render(): void {
  const segments = new Set(snake.map(({ x, y }) => `${x},${y}`));
  const head = snake[0];
  boardElement.replaceChildren(...Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
    const x = index % GRID_SIZE;
    const y = Math.floor(index / GRID_SIZE);
    const cell = document.createElement('span');
    cell.className = 'snake-cell';
    if (head.x === x && head.y === y) cell.classList.add('snake-head');
    else if (segments.has(`${x},${y}`)) cell.classList.add('snake-body');
    else if (food.x === x && food.y === y) cell.classList.add('snake-food');
    return cell;
  }));
  scoreElement.value = String(score);
  bestElement.value = String(best);
  renderLives(livesElement, lives);
}

function stopTimer(): void {
  if (timer !== undefined) window.clearInterval(timer);
  timer = undefined;
}

function startTimer(): void {
  stopTimer();
  if (!paused && !gameOver) timer = window.setInterval(tick, speedForScore(score));
}

function showOverlay(title: string, text: string, canResume: boolean): void {
  overlay.hidden = false;
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  resumeButton.hidden = !canResume;
}

function hideOverlay(): void { overlay.hidden = true; }

function pause(): void {
  if (paused || gameOver) return;
  paused = true;
  stopTimer();
  pauseButton.textContent = '▶';
  pauseButton.setAttribute('aria-label', 'Resume game');
  showOverlay('Paused.', 'Your run is waiting.', true);
}

function resume(): void {
  if (!paused || gameOver) return;
  paused = false;
  pauseButton.textContent = 'Ⅱ';
  pauseButton.setAttribute('aria-label', 'Pause game');
  hideOverlay();
  startTimer();
}

function tick(): void {
  direction = queuedDirection;
  const result = stepSnake(snake, direction, food);
  if (result.collision) {
    stopTimer();
    haptic('impact');
    if (lives > 1) {
      lives -= 1;
      respawnAfterLifeLoss();
    } else {
      lives = 0;
      gameOver = true;
      showOverlay('Run over.', result.collision === 'wall' ? 'The edge got you.' : 'You ran into yourself.', false);
      render();
    }
    return;
  }
  snake = result.snake;
  if (result.ate) {
    score += 1;
    saveBest();
    haptic('confirm');
    const nextFood = spawnFood(snake);
    if (!nextFood) {
      gameOver = true;
      stopTimer();
      showOverlay('Board cleared.', 'A perfect run.', false);
    } else {
      food = nextFood;
      startTimer();
    }
  }
  render();
}

function respawnAfterLifeLoss(): void {
  snake = initialSnake();
  food = spawnFood(snake)!;
  direction = 'right';
  queuedDirection = 'right';
  paused = true;
  pauseButton.textContent = '▶';
  pauseButton.setAttribute('aria-label', 'Resume game');
  showOverlay('Life saved.', 'Ready when you are.', true);
  render();
}

function requestDirection(next: Direction): void {
  if (gameOver || paused || !canQueueDirection(direction, queuedDirection, next)) return;
  queuedDirection = next;
}

function restart(): void {
  stopTimer();
  snake = initialSnake();
  food = spawnFood(snake)!;
  direction = 'right';
  queuedDirection = 'right';
  score = 0;
  gameOver = false;
  paused = false;
  lives = MAX_LIVES;
  pauseButton.textContent = 'Ⅱ';
  pauseButton.setAttribute('aria-label', 'Pause game');
  hideOverlay();
  render();
  startTimer();
}

document.querySelectorAll<HTMLButtonElement>('[data-snake-restart]').forEach((button) => button.addEventListener('click', restart));
resumeButton.addEventListener('click', resume);
pauseButton.addEventListener('click', () => { if (paused) resume(); else pause(); });

window.addEventListener('keydown', (event) => {
  const directionByKey: Record<string, Direction | undefined> = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    a: 'left', d: 'right', w: 'up', s: 'down', A: 'left', D: 'right', W: 'up', S: 'down',
  };
  const next = directionByKey[event.key];
  if (!next) return;
  event.preventDefault();
  requestDirection(next);
});

let swipeStart: { x: number; y: number; pointerId: number } | undefined;
boardElement.addEventListener('pointerdown', (event) => {
  if (event.pointerType !== 'touch') return;
  event.preventDefault();
  boardElement.setPointerCapture(event.pointerId);
  swipeStart = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
}, { passive: false });
boardElement.addEventListener('pointermove', (event) => { if (swipeStart) event.preventDefault(); }, { passive: false });
boardElement.addEventListener('pointerup', (event) => {
  if (!swipeStart || event.pointerId !== swipeStart.pointerId) return;
  event.preventDefault();
  const dx = event.clientX - swipeStart.x;
  const dy = event.clientY - swipeStart.y;
  swipeStart = undefined;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_DISTANCE) return;
  requestDirection(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'));
}, { passive: false });
boardElement.addEventListener('pointercancel', () => { swipeStart = undefined; });

pauseWhenBackgrounded(pause);

render();
startTimer();
