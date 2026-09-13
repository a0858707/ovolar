import Phaser from 'phaser';
import { createShuffledBag, type PieceKind } from './game/bag';
import { findClockwiseRotation, type Matrix } from './game/rotation';
import { TouchRepeater, type RepeatScheduler } from './game/touch-repeat';
import { rescueBlockBoard } from './game/block-rescue';
import { haptic } from './feedback';
import { MAX_LIVES, renderLives } from './platform';
import './style.css';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL = 30;
const BOARD_X = 15;
const BOARD_Y = 15;

type Cell = 0 | PieceKind;
type Action = 'left' | 'right' | 'rotate' | 'down' | 'drop' | 'restart' | 'pause';

interface ActivePiece {
  kind: PieceKind;
  shape: Matrix;
  x: number;
  y: number;
}

interface GameState {
  score: number;
  best: number;
  lines: number;
  level: number;
  over: boolean;
  paused: boolean;
  lives: number;
  next: PieceKind;
}

interface LineClearEvent {
  lines: number;
  points: number;
}

const SHAPES: Record<PieceKind, Matrix> = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
  O: [[1, 1], [1, 1]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
};

const COLORS: Record<PieceKind, number> = {
  I: 0x56d7ee,
  J: 0x7086ff,
  L: 0xffaa62,
  O: 0xffd75e,
  S: 0x75dc96,
  T: 0xb587ff,
  Z: 0xff7184,
};

const SCORE_FOR_LINES = [0, 100, 300, 500, 800];
const STORAGE_KEY = 'ovolar.block.best';
const LEGACY_STORAGE_KEYS = ['ovolar-block-best-score', 'dropstack-best-score'];

const cloneMatrix = (matrix: Matrix): Matrix => matrix.map((row) => [...row]);

const readBestScore = (): number => {
  try {
    const currentBest = localStorage.getItem(STORAGE_KEY);
    if (currentBest !== null) return Number.parseInt(currentBest, 10) || 0;

    const legacyBest = LEGACY_STORAGE_KEYS
      .map((key) => localStorage.getItem(key))
      .find((value): value is string => value !== null);
    const best = Number.parseInt(legacyBest ?? '0', 10) || 0;
    if (best > 0) localStorage.setItem(STORAGE_KEY, String(best));
    return best;
  } catch {
    return 0;
  }
};

class OvolarBlockScene extends Phaser.Scene {
  private board: Cell[][] = [];
  private piece!: ActivePiece;
  private graphics!: Phaser.GameObjects.Graphics;
  private bag: PieceKind[] = [];
  private nextKind!: PieceKind;
  private state: GameState = { score: 0, best: readBestScore(), lines: 0, level: 1, over: false, paused: false, lives: MAX_LIVES, next: 'I' };
  private elapsed = 0;
  private dropInterval = 750;

  constructor() {
    super('ovolar-block');
  }

  create(): void {
    this.graphics = this.add.graphics();
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => this.handleKeyboard(event));
    window.addEventListener('ovolar-block-control', this.handleControl as EventListener);
    const pauseWhenHidden = (): void => {
      if (document.hidden && !this.state.over && !this.state.paused) this.setPaused(true);
    };
    const pauseWhenBlurred = (): void => {
      if (!this.state.over && !this.state.paused) this.setPaused(true);
    };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    window.addEventListener('blur', pauseWhenBlurred);
    window.addEventListener('ovolar-background', pauseWhenBlurred);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('ovolar-block-control', this.handleControl as EventListener);
      document.removeEventListener('visibilitychange', pauseWhenHidden);
      window.removeEventListener('blur', pauseWhenBlurred);
      window.removeEventListener('ovolar-background', pauseWhenBlurred);
    });
    this.reset();
  }

  update(_time: number, delta: number): void {
    if (this.state.over || this.state.paused) return;
    this.elapsed += delta;
    if (this.elapsed >= this.dropInterval) {
      this.elapsed = 0;
      this.stepDown();
    }
  }

  private handleKeyboard(event: KeyboardEvent): void {
    const actionByKey: Record<string, Action | undefined> = {
      ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'rotate', ArrowDown: 'down', ' ': 'drop', Spacebar: 'drop', r: 'restart', R: 'restart', p: 'pause', P: 'pause', Escape: 'pause',
    };
    const action = actionByKey[event.key];
    if (!action) return;
    event.preventDefault();
    this.act(action);
  }

  private handleControl = (event: Event): void => {
    const action = (event as CustomEvent<Action>).detail;
    this.act(action);
  };

  private act(action: Action): void {
    if (action === 'restart') {
      this.reset();
      return;
    }
    if (action === 'pause') {
      if (!this.state.over) this.setPaused(!this.state.paused);
      return;
    }
    if (this.state.over || this.state.paused) return;
    if (action === 'left') this.move(-1);
    if (action === 'right') this.move(1);
    if (action === 'rotate') this.rotate();
    if (action === 'down') this.stepDown(true);
    if (action === 'drop') this.hardDrop();
  }

  private reset(): void {
    this.board = Array.from({ length: BOARD_HEIGHT }, () => Array<Cell>(BOARD_WIDTH).fill(0));
    this.bag = [];
    this.nextKind = this.nextPieceKind();
    this.state = { score: 0, best: readBestScore(), lines: 0, level: 1, over: false, paused: false, lives: MAX_LIVES, next: this.nextKind };
    this.dropInterval = 750;
    this.elapsed = 0;
    this.spawnPiece();
    this.broadcast();
    this.draw();
  }

  private spawnPiece(): void {
    const kind = this.nextKind;
    this.nextKind = this.nextPieceKind();
    this.state.next = this.nextKind;
    const shape = cloneMatrix(SHAPES[kind]);
    this.piece = { kind, shape, x: Math.floor((BOARD_WIDTH - shape[0].length) / 2), y: 0 };
    if (this.collides(this.piece)) {
      this.handleTopOut();
    }
  }

  private handleTopOut(): void {
    if (this.state.lives <= 1) {
      this.state.lives = 0;
      this.state.over = true;
      this.saveBest();
      haptic('impact');
      return;
    }
    this.state.lives -= 1;
    this.board = rescueBlockBoard(this.board, 0);
    this.elapsed = 0;
    haptic('impact');
  }

  private nextPieceKind(): PieceKind {
    if (this.bag.length === 0) this.bag = createShuffledBag();
    return this.bag.pop()!;
  }

  private setPaused(paused: boolean): void {
    this.state.paused = paused;
    this.elapsed = 0;
    this.broadcast();
  }

  private move(dx: number): void {
    const candidate = { ...this.piece, x: this.piece.x + dx };
    if (!this.collides(candidate)) {
      this.piece = candidate;
      this.draw();
    }
  }

  private rotate(): void {
    const result = findClockwiseRotation(
      this.piece.shape,
      this.piece.x,
      this.piece.y,
      (shape, x, y) => this.collides({ ...this.piece, shape, x, y }),
    );
    if (!result) return;
    this.piece = { ...this.piece, ...result };
    this.draw();
  }

  private stepDown(softDrop = false): void {
    const candidate = { ...this.piece, y: this.piece.y + 1 };
    if (!this.collides(candidate)) {
      this.piece = candidate;
      if (softDrop) this.state.score += 1;
      this.broadcast();
      this.draw();
      return;
    }
    this.lockPiece();
  }

  private hardDrop(): void {
    let distance = 0;
    while (!this.collides({ ...this.piece, y: this.piece.y + 1 })) {
      this.piece.y += 1;
      distance += 1;
    }
    this.state.score += distance * 2;
    this.lockPiece();
  }

  private collides(piece: ActivePiece): boolean {
    return piece.shape.some((row, y) => row.some((filled, x) => {
      if (!filled) return false;
      const boardX = piece.x + x;
      const boardY = piece.y + y;
      return boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT || (boardY >= 0 && this.board[boardY][boardX] !== 0);
    }));
  }

  private lockPiece(): void {
    this.piece.shape.forEach((row, y) => row.forEach((filled, x) => {
      if (filled && this.piece.y + y >= 0) this.board[this.piece.y + y][this.piece.x + x] = this.piece.kind;
    }));
    this.clearRows();
    this.spawnPiece();
    this.broadcast();
    this.draw();
  }

  private clearRows(): void {
    const keptRows = this.board.filter((row) => row.some((cell) => cell === 0));
    const cleared = BOARD_HEIGHT - keptRows.length;
    if (!cleared) return;
    while (keptRows.length < BOARD_HEIGHT) keptRows.unshift(Array<Cell>(BOARD_WIDTH).fill(0));
    this.board = keptRows;
    const points = SCORE_FOR_LINES[cleared] * this.state.level;
    this.state.score += points;
    this.state.lines += cleared;
    this.state.level = Math.floor(this.state.lines / 10) + 1;
    this.dropInterval = Math.max(110, 750 - (this.state.level - 1) * 58);
    this.saveBest();
    haptic('success');
    this.cameras.main.flash(110, 255, 221, 123, false);
    window.dispatchEvent(new CustomEvent<LineClearEvent>('ovolar-block-line-clear', { detail: { lines: cleared, points } }));
  }

  private saveBest(): void {
    if (this.state.score <= this.state.best) return;
    this.state.best = this.state.score;
    try {
      localStorage.setItem(STORAGE_KEY, String(this.state.best));
    } catch {
      // Gameplay remains available when browser storage is disabled.
    }
  }

  private broadcast(): void {
    this.saveBest();
    window.dispatchEvent(new CustomEvent<GameState>('ovolar-block-state', { detail: { ...this.state } }));
  }

  private draw(): void {
    this.graphics.clear();
    this.graphics.fillStyle(0x28182e, 1);
    this.graphics.fillRoundedRect(0, 0, 330, 630, 14);
    this.graphics.fillStyle(0x160f1a, 1);
    this.graphics.fillRoundedRect(BOARD_X - 2, BOARD_Y - 2, BOARD_WIDTH * CELL + 4, BOARD_HEIGHT * CELL + 4, 6);
    this.graphics.lineStyle(1, 0x4a3652, 0.85);
    for (let x = 0; x <= BOARD_WIDTH; x += 1) this.graphics.lineBetween(BOARD_X + x * CELL, BOARD_Y, BOARD_X + x * CELL, BOARD_Y + BOARD_HEIGHT * CELL);
    for (let y = 0; y <= BOARD_HEIGHT; y += 1) this.graphics.lineBetween(BOARD_X, BOARD_Y + y * CELL, BOARD_X + BOARD_WIDTH * CELL, BOARD_Y + y * CELL);
    this.board.forEach((row, y) => row.forEach((cell, x) => {
      if (cell) this.drawCell(x, y, COLORS[cell], 1);
    }));
    if (!this.state.over) {
      this.piece.shape.forEach((row, y) => row.forEach((filled, x) => {
        if (filled) this.drawCell(this.piece.x + x, this.piece.y + y, COLORS[this.piece.kind], 1);
      }));
    }
    this.graphics.fillStyle(0xc8e96b, 0.75);
    this.graphics.fillRect(BOARD_X, 625, BOARD_WIDTH * CELL, 1);
  }

  private drawCell(x: number, y: number, color: number, alpha: number): void {
    if (y < 0) return;
    const px = BOARD_X + x * CELL;
    const py = BOARD_Y + y * CELL;
    this.graphics.fillStyle(color, alpha);
    this.graphics.fillRoundedRect(px + 2, py + 2, CELL - 4, CELL - 4, 5);
    this.graphics.fillStyle(0xffffff, 0.17);
    this.graphics.fillRoundedRect(px + 5, py + 5, CELL - 10, 5, 3);
  }
}

const game = new Phaser.Game({
  // Block only uses Phaser's 2D Graphics API. Avoid a WebGL boot/fallback before
  // the scene can create and paint its first tetromino, especially on mobile WebViews.
  type: Phaser.CANVAS,
  parent: 'game-root',
  width: 330,
  height: 630,
  backgroundColor: '#10162b',
  transparent: true,
  scene: [OvolarBlockScene],
  render: { antialias: true, pixelArt: false },
});

const score = document.querySelector<HTMLOutputElement>('#score')!;
const best = document.querySelector<HTMLOutputElement>('#best-score')!;
const lines = document.querySelector<HTMLOutputElement>('#lines')!;
const level = document.querySelector<HTMLOutputElement>('#level')!;
const gameOver = document.querySelector<HTMLElement>('#game-over')!;
const finalScore = document.querySelector<HTMLElement>('#final-score')!;
const finalBest = document.querySelector<HTMLElement>('#final-best')!;
const pauseOverlay = document.querySelector<HTMLElement>('#pause-overlay')!;
const pauseButton = document.querySelector<HTMLButtonElement>('#pause-button')!;
const nextPiece = document.querySelector<HTMLElement>('#next-piece')!;
const lineClear = document.querySelector<HTMLElement>('#line-clear')!;
const lives = document.querySelector<HTMLElement>('#block-lives')!;

const colorToCss = (color: number): string => `#${color.toString(16).padStart(6, '0')}`;

const renderNextPiece = (kind: PieceKind): void => {
  const shape = SHAPES[kind];
  const cells = Array.from({ length: 16 }, () => document.createElement('span'));
  const xOffset = Math.floor((4 - shape[0].length) / 2);
  const yOffset = Math.floor((4 - shape.length) / 2);
  shape.forEach((row, y) => row.forEach((filled, x) => {
    if (!filled) return;
    const cell = cells[(y + yOffset) * 4 + x + xOffset];
    cell.style.backgroundColor = colorToCss(COLORS[kind]);
    cell.classList.add('filled');
  }));
  nextPiece.replaceChildren(...cells);
  nextPiece.setAttribute('aria-label', `Next piece: ${kind}`);
};

window.addEventListener('ovolar-block-state', ((event: CustomEvent<GameState>) => {
  const state = event.detail;
  score.value = String(state.score);
  best.value = String(state.best);
  lines.value = String(state.lines);
  level.value = String(state.level);
  renderLives(lives, state.lives);
  gameOver.hidden = !state.over;
  pauseOverlay.hidden = !state.paused;
  pauseButton.textContent = state.paused ? '▶' : 'Ⅱ';
  pauseButton.setAttribute('aria-label', state.paused ? 'Resume game' : 'Pause game');
  pauseButton.title = state.paused ? 'Resume game' : 'Pause game';
  finalScore.textContent = String(state.score);
  finalBest.textContent = String(state.best);
  renderNextPiece(state.next);
}) as EventListener);

let lineClearTimer: number | undefined;
window.addEventListener('ovolar-block-line-clear', ((event: CustomEvent<LineClearEvent>) => {
  const { lines: cleared, points } = event.detail;
  const label = cleared === 4 ? 'TETRIS' : `${cleared} LINE${cleared === 1 ? '' : 'S'}`;
  lineClear.textContent = `${label} +${points}`;
  lineClear.hidden = false;
  lineClear.classList.remove('show');
  void lineClear.offsetWidth;
  lineClear.classList.add('show');
  if (lineClearTimer !== undefined) window.clearTimeout(lineClearTimer);
  lineClearTimer = window.setTimeout(() => { lineClear.hidden = true; }, 850);
}) as EventListener);

const dispatchAction = (action: Action): void => {
  window.dispatchEvent(new CustomEvent<Action>('ovolar-block-control', { detail: action }));
};

const HOLD_DELAY_MS = 190;
const HOLD_INTERVAL_MS = 58;
const HOLDABLE_ACTIONS = new Set<Action>(['left', 'right', 'down']);
let heldPointerId: number | undefined;

const browserRepeatScheduler: RepeatScheduler = {
  setTimeout: (callback, delayMs) => window.setTimeout(callback, delayMs),
  clearTimeout: (handle) => window.clearTimeout(handle as number),
  setInterval: (callback, intervalMs) => window.setInterval(callback, intervalMs),
  clearInterval: (handle) => window.clearInterval(handle as number),
};

const touchRepeater = new TouchRepeater<Action>(
  dispatchAction,
  browserRepeatScheduler,
  HOLD_DELAY_MS,
  HOLD_INTERVAL_MS,
);

const stopHeldControl = (): void => {
  touchRepeater.stop();
  heldPointerId = undefined;
};

const stopHeldPointer = (event: PointerEvent): void => {
  if (event.pointerId === heldPointerId) stopHeldControl();
};

document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => {
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    const action = button.dataset.action as Action;
    stopHeldControl();
    if (!HOLDABLE_ACTIONS.has(action)) {
      dispatchAction(action);
      return;
    }

    heldPointerId = event.pointerId;
    button.setPointerCapture(event.pointerId);
    touchRepeater.start(action);
  });
  button.addEventListener('pointerup', stopHeldPointer);
  button.addEventListener('pointercancel', stopHeldPointer);
  button.addEventListener('lostpointercapture', stopHeldPointer);
  button.addEventListener('contextmenu', (event) => event.preventDefault());
  button.addEventListener('selectstart', (event) => event.preventDefault());
});

interface BlockGesture {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  startedAt: number;
  accumulatedX: number;
  accumulatedY: number;
  mode: 'pending' | 'horizontal' | 'soft-drop' | 'held-drop';
}

const GESTURE_DISTANCE = 14;
const HARD_DROP_DISTANCE = 84;
const HARD_DROP_WINDOW_MS = 280;
const TAP_DISTANCE = 14;
const TAP_WINDOW_MS = 280;
const HOLD_TO_DROP_MS = 190;
let blockGesture: BlockGesture | undefined;
let gestureHoldTimer: number | undefined;

const clearGestureHold = (): void => {
  if (gestureHoldTimer !== undefined) window.clearTimeout(gestureHoldTimer);
  gestureHoldTimer = undefined;
};

const finishBlockGesture = (): void => {
  clearGestureHold();
  touchRepeater.stop();
  blockGesture = undefined;
};

const startGestureSoftDrop = (): void => {
  if (!blockGesture || blockGesture.mode !== 'pending') return;
  blockGesture.mode = 'held-drop';
  touchRepeater.start('down');
};

const isTouchFirst = window.matchMedia('(pointer: coarse)').matches;
const gameRoot = document.querySelector<HTMLElement>('#game-root')!;

const dragStepThreshold = (): number => {
  const canvas = gameRoot.querySelector<HTMLCanvasElement>('canvas');
  const canvasWidth = canvas?.getBoundingClientRect().width ?? 0;
  // The Phaser canvas is 11 cells wide: ten board columns plus its side gutter.
  const cellWidth = canvasWidth > 0 ? canvasWidth / 11 : CELL;
  return Math.max(18, cellWidth * 0.82);
};

const processHorizontalDrag = (): void => {
  if (!blockGesture) return;
  const threshold = dragStepThreshold();
  while (Math.abs(blockGesture.accumulatedX) >= threshold) {
    const direction = Math.sign(blockGesture.accumulatedX);
    dispatchAction(direction < 0 ? 'left' : 'right');
    blockGesture.accumulatedX -= direction * threshold;
  }
};

const processDownwardDrag = (): void => {
  if (!blockGesture) return;
  const threshold = dragStepThreshold();
  while (blockGesture.accumulatedY >= threshold) {
    dispatchAction('down');
    blockGesture.accumulatedY -= threshold;
  }
};

if (isTouchFirst) {
  gameRoot.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch') return;
    event.preventDefault();
    finishBlockGesture();
    gameRoot.setPointerCapture(event.pointerId);
    blockGesture = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      startedAt: performance.now(),
      accumulatedX: 0,
      accumulatedY: 0,
      mode: 'pending',
    };
    gestureHoldTimer = window.setTimeout(startGestureSoftDrop, HOLD_TO_DROP_MS);
  }, { passive: false });

  gameRoot.addEventListener('pointermove', (event) => {
    if (!blockGesture || event.pointerId !== blockGesture.pointerId) return;
    event.preventDefault();
    const dx = event.clientX - blockGesture.startX;
    const dy = event.clientY - blockGesture.startY;
    const elapsed = performance.now() - blockGesture.startedAt;
    const deltaX = event.clientX - blockGesture.lastX;
    const deltaY = event.clientY - blockGesture.lastY;
    blockGesture.lastX = event.clientX;
    blockGesture.lastY = event.clientY;

    if (blockGesture.mode !== 'horizontal' && dy >= HARD_DROP_DISTANCE && elapsed <= HARD_DROP_WINDOW_MS) {
      clearGestureHold();
      dispatchAction('drop');
      finishBlockGesture();
      return;
    }

    if (blockGesture.mode === 'pending' && Math.abs(dx) >= GESTURE_DISTANCE && Math.abs(dx) > Math.abs(dy)) {
      clearGestureHold();
      blockGesture.mode = 'horizontal';
      blockGesture.accumulatedX = dx;
      processHorizontalDrag();
      return;
    }

    if (blockGesture.mode === 'pending' && dy >= GESTURE_DISTANCE && dy >= Math.abs(dx)) {
      clearGestureHold();
      blockGesture.mode = 'soft-drop';
      blockGesture.accumulatedY = dy;
      processDownwardDrag();
      return;
    }

    if (blockGesture.mode === 'horizontal') {
      blockGesture.accumulatedX += deltaX;
      processHorizontalDrag();
    } else if (blockGesture.mode === 'soft-drop') {
      blockGesture.accumulatedY = Math.max(0, blockGesture.accumulatedY + deltaY);
      processDownwardDrag();
    }
  }, { passive: false });

  const endGesture = (event: PointerEvent): void => {
    if (!blockGesture || event.pointerId !== blockGesture.pointerId) return;
    event.preventDefault();
    const { startX, startY, startedAt, mode } = blockGesture;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const elapsed = performance.now() - startedAt;
    if (mode === 'pending' && dy >= HARD_DROP_DISTANCE && elapsed <= HARD_DROP_WINDOW_MS) {
      dispatchAction('drop');
    } else if (mode === 'pending' && Math.hypot(dx, dy) <= TAP_DISTANCE && elapsed <= TAP_WINDOW_MS) {
      dispatchAction('rotate');
    }
    finishBlockGesture();
  };

  gameRoot.addEventListener('pointerup', endGesture, { passive: false });
  gameRoot.addEventListener('pointercancel', finishBlockGesture);
  gameRoot.addEventListener('lostpointercapture', finishBlockGesture);
}

window.addEventListener('pointerup', (event) => {
  stopHeldPointer(event);
});
window.addEventListener('pointercancel', stopHeldPointer);
window.addEventListener('blur', () => { stopHeldControl(); finishBlockGesture(); });
window.addEventListener('ovolar-background', () => { stopHeldControl(); finishBlockGesture(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { stopHeldControl(); finishBlockGesture(); }
});
document.querySelectorAll<HTMLButtonElement>('#restart-top, #restart-overlay').forEach((button) => {
  button.addEventListener('click', () => {
    stopHeldControl();
    dispatchAction('restart');
  });
});
document.querySelectorAll<HTMLButtonElement>('#pause-button, #resume-overlay').forEach((button) => {
  button.addEventListener('click', () => {
    stopHeldControl();
    dispatchAction('pause');
  });
});

void game;
