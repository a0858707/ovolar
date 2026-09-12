export interface RepeatScheduler {
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
  setInterval(callback: () => void, intervalMs: number): unknown;
  clearInterval(handle: unknown): void;
}

export class TouchRepeater<Action> {
  private delayHandle: unknown;
  private intervalHandle: unknown;

  constructor(
    private readonly emit: (action: Action) => void,
    private readonly scheduler: RepeatScheduler,
    private readonly initialDelayMs: number,
    private readonly intervalMs: number,
  ) {}

  start(action: Action): void {
    this.stop();
    this.emit(action);
    this.delayHandle = this.scheduler.setTimeout(() => {
      this.emit(action);
      this.intervalHandle = this.scheduler.setInterval(() => this.emit(action), this.intervalMs);
    }, this.initialDelayMs);
  }

  stop(): void {
    if (this.delayHandle !== undefined) this.scheduler.clearTimeout(this.delayHandle);
    if (this.intervalHandle !== undefined) this.scheduler.clearInterval(this.intervalHandle);
    this.delayHandle = undefined;
    this.intervalHandle = undefined;
  }
}
