import { canMove, createStartingBoard, moveBoard, rescueBoard, type Board, type Direction } from './game/twenty48';
import { haptic } from './feedback';
import { MAX_LIVES, readStoredNumber, renderLives, storageKey, writeStoredNumber } from './platform';

const BEST_KEY = storageKey('2048', 'best');
const SWIPE_DISTANCE = 28;

const boardElement = document.querySelector<HTMLElement>('#twenty48-board')!;
const scoreElement = document.querySelector<HTMLOutputElement>('#twenty48-score')!;
const bestElement = document.querySelector<HTMLOutputElement>('#twenty48-best')!;
const overlay = document.querySelector<HTMLElement>('#twenty48-overlay')!;
const overlayTitle = document.querySelector<HTMLElement>('#twenty48-overlay-title')!;
const overlayText = document.querySelector<HTMLElement>('#twenty48-overlay-text')!;
const continueButton = document.querySelector<HTMLButtonElement>('#twenty48-continue')!;
const livesElement = document.querySelector<HTMLElement>('#twenty48-lives')!;
const lifeNotice = document.querySelector<HTMLElement>('#twenty48-life-notice')!;

let board: Board = createStartingBoard();
let score = 0;
let best = readBest();
let wonDismissed = false;
let gameOver = false;
let movingTimer: number | undefined;
let lives = MAX_LIVES;
let lifeNoticeTimer: number | undefined;

function readBest(): number { return readStoredNumber(BEST_KEY); }

function saveBest(): void {
  if (score <= best) return;
  best = score;
  writeStoredNumber(BEST_KEY, best);
}

function render(animated = false): void {
  boardElement.replaceChildren(...board.flatMap((row) => row.map((value) => {
    const tile = document.createElement('span');
    tile.className = `twenty48-tile${value ? ` value-${Math.min(value, 2048)}` : ''}`;
    tile.textContent = value ? String(value) : '';
    return tile;
  })));
  scoreElement.value = String(score);
  bestElement.value = String(best);
  renderLives(livesElement, lives);
  if (animated) {
    boardElement.classList.remove('is-moving');
    void boardElement.offsetWidth;
    boardElement.classList.add('is-moving');
    if (movingTimer !== undefined) window.clearTimeout(movingTimer);
    movingTimer = window.setTimeout(() => boardElement.classList.remove('is-moving'), 180);
  }
}

function showOverlay(type: 'win' | 'over'): void {
  overlay.hidden = false;
  overlay.dataset.state = type;
  overlayTitle.textContent = type === 'win' ? '2048 reached.' : 'No moves left.';
  overlayText.textContent = type === 'win' ? 'Keep going or start a fresh board.' : `Score ${score} · Best ${best}`;
  continueButton.hidden = type !== 'win';
}

function hideOverlay(): void { overlay.hidden = true; }

function showLifeNotice(): void {
  lifeNotice.textContent = 'One life used · board opened';
  lifeNotice.hidden = false;
  if (lifeNoticeTimer !== undefined) window.clearTimeout(lifeNoticeTimer);
  lifeNoticeTimer = window.setTimeout(() => { lifeNotice.hidden = true; }, 1400);
}

function move(direction: Direction): void {
  if (gameOver || !overlay.hidden) return;
  const result = moveBoard(board, direction);
  if (!result.moved) return;
  board = result.board;
  score += result.scoreDelta;
  saveBest();
  board = createSpawnedBoard(board);
  if (result.created2048 && !wonDismissed) showOverlay('win');
  else if (!canMove(board)) {
    if (lives > 1) {
      lives -= 1;
      board = rescueBoard(board);
      haptic('impact');
      showLifeNotice();
    } else {
      lives = 0;
      gameOver = true;
      haptic('impact');
      showOverlay('over');
    }
  }
  render(true);
}

function createSpawnedBoard(current: Board): Board {
  const emptyCells: Array<[number, number]> = [];
  current.forEach((row, y) => row.forEach((value, x) => { if (!value) emptyCells.push([x, y]); }));
  if (!emptyCells.length) return current;
  const [x, y] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const next = current.map((row) => [...row]);
  next[y][x] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function restart(): void {
  board = createStartingBoard();
  score = 0;
  wonDismissed = false;
  gameOver = false;
  lives = MAX_LIVES;
  lifeNotice.hidden = true;
  hideOverlay();
  render();
}

document.querySelectorAll<HTMLButtonElement>('[data-twenty48-restart]').forEach((button) => button.addEventListener('click', restart));
continueButton.addEventListener('click', () => { wonDismissed = true; hideOverlay(); });

window.addEventListener('keydown', (event) => {
  const directionByKey: Record<string, Direction | undefined> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
  const direction = directionByKey[event.key];
  if (!direction) return;
  event.preventDefault();
  move(direction);
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
  move(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'));
}, { passive: false });
boardElement.addEventListener('pointercancel', () => { swipeStart = undefined; });

render();
