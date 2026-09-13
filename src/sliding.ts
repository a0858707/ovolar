import { areAdjacent, isSolved, moveTile, shuffledBoard, type SlidingBoard } from './game/sliding';
import { haptic } from './feedback';
import { readStoredNumber, storageKey, writeStoredNumber } from './platform';

const BEST_MOVES_KEY = storageKey('sliding', 'best-moves');
const BEST_TIME_KEY = storageKey('sliding', 'best-seconds');

const boardElement = document.querySelector<HTMLElement>('#sliding-board')!;
const movesElement = document.querySelector<HTMLOutputElement>('#sliding-moves')!;
const bestElement = document.querySelector<HTMLOutputElement>('#sliding-best')!;
const timeElement = document.querySelector<HTMLOutputElement>('#sliding-time')!;
const overlay = document.querySelector<HTMLElement>('#sliding-overlay')!;
const resultElement = document.querySelector<HTMLElement>('#sliding-result')!;

let board: SlidingBoard = shuffledBoard();
let moves = 0;
let seconds = 0;
let won = false;
let bestMoves = readStoredNumber(BEST_MOVES_KEY);
let bestSeconds = readStoredNumber(BEST_TIME_KEY);

const formatTime = (value: number): string => `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;

const renderStats = (): void => {
  movesElement.value = String(moves);
  bestElement.value = bestMoves ? String(bestMoves) : '—';
  timeElement.value = formatTime(seconds);
};

const render = (animated = false): void => {
  boardElement.replaceChildren(...board.map((tile, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `sliding-tile${tile === null ? ' is-empty' : ''}`;
    button.dataset.index = String(index);
    button.textContent = tile === null ? '' : String(tile);
    button.setAttribute('aria-label', tile === null ? 'Empty space' : `Tile ${tile}`);
    button.setAttribute('aria-disabled', String(tile === null));
    return button;
  }));
  renderStats();
  if (animated) {
    boardElement.classList.remove('is-moving');
    void boardElement.offsetWidth;
    boardElement.classList.add('is-moving');
    window.setTimeout(() => boardElement.classList.remove('is-moving'), 180);
  }
};

const finish = (): void => {
  won = true;
  if (!bestMoves || moves < bestMoves) { bestMoves = moves; writeStoredNumber(BEST_MOVES_KEY, bestMoves); }
  if (!bestSeconds || seconds < bestSeconds) { bestSeconds = seconds; writeStoredNumber(BEST_TIME_KEY, bestSeconds); }
  resultElement.textContent = `${moves} moves · ${formatTime(seconds)}`;
  overlay.hidden = false;
  haptic('success');
  renderStats();
};

const tryMove = (index: number): void => {
  if (won) return;
  const next = moveTile(board, index);
  if (!next) { haptic('impact'); return; }
  board = next;
  moves += 1;
  haptic('confirm');
  render(true);
  if (isSolved(board)) finish();
};

const restart = (): void => {
  board = shuffledBoard();
  moves = 0;
  seconds = 0;
  won = false;
  overlay.hidden = true;
  render();
};

const moveWithArrow = (key: string): void => {
  const empty = board.indexOf(null);
  const targetByKey: Record<string, number> = {
    ArrowLeft: empty + 1, ArrowRight: empty - 1, ArrowUp: empty + 4, ArrowDown: empty - 4,
  };
  const target = targetByKey[key];
  if (target !== undefined && target >= 0 && target < board.length && areAdjacent(target, empty)) tryMove(target);
  else haptic('impact');
};

boardElement.addEventListener('click', (event) => {
  const tile = (event.target as HTMLElement).closest<HTMLButtonElement>('.sliding-tile');
  if (tile) tryMove(Number(tile.dataset.index));
});
document.querySelectorAll<HTMLButtonElement>('[data-sliding-restart]').forEach((button) => button.addEventListener('click', restart));
window.addEventListener('keydown', (event) => {
  if (!event.key.startsWith('Arrow')) return;
  event.preventDefault();
  moveWithArrow(event.key);
});
window.setInterval(() => { if (!won && !document.hidden) { seconds += 1; renderStats(); } }, 1000);

render();
