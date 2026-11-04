import type { AgentSource } from '@tokenaires/contracts';

export interface ScanProgress {
  searching: number;
  found: number;
  read: number;
  cached: number;
  reading: AgentSource | null;
}

export type ScanProgressListener = (progress: Readonly<ScanProgress>) => void;

export class ScanTracker {
  readonly progress: ScanProgress;
  private readonly remaining = new Map<AgentSource, number>();

  constructor(
    sources: number,
    private readonly listener?: ScanProgressListener,
  ) {
    this.progress = { searching: sources, found: 0, read: 0, cached: 0, reading: null };
  }

  discovered(source: AgentSource, files: number): void {
    this.progress.searching -= 1;
    this.progress.found += files;
    if (files > 0) this.remaining.set(source, files);
    this.update();
  }

  fileRead(source: AgentSource, cached: boolean): void {
    this.progress.read += 1;
    if (cached) this.progress.cached += 1;
    const left = (this.remaining.get(source) ?? 1) - 1;
    if (left > 0) this.remaining.set(source, left);
    else this.remaining.delete(source);
    this.update();
  }

  private update(): void {
    this.progress.reading = this.remaining.keys().next().value ?? null;
    this.listener?.(this.progress);
  }
}
