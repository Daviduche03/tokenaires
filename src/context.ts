import { execFile } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { homedir, hostname } from 'node:os';

export interface Output {
  line(text?: string): void;
  error(text: string): void;
}

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

export type Runner = (command: string, args: string[]) => Promise<RunResult>;

export interface Context {
  env: NodeJS.ProcessEnv;
  home: string;
  platform: NodeJS.Platform;
  hostname: string;
  nodePath: string;
  scriptPath: string;
  out: Output;
  fetch: typeof fetch;
  sleep(ms: number): Promise<void>;
  openUrl(url: string): void;
  run: Runner;
  now(): number;
}

export const runCommand: Runner = (command, args) =>
  new Promise((resolve) => {
    execFile(command, args, (error, stdout, stderr) => {
      const code = error ? (typeof error.code === 'number' ? error.code : 1) : 0;
      resolve({ code, stdout, stderr });
    });
  });

function openerFor(platform: NodeJS.Platform): string | null {
  if (platform === 'darwin') return 'open';
  if (platform === 'linux') return 'xdg-open';
  return null;
}

function resolveScript(path: string | undefined): string {
  if (!path) return '';
  try {
    return realpathSync(path);
  } catch {
    return path;
  }
}

export function createContext(): Context {
  const platform = process.platform;
  return {
    env: process.env,
    home: homedir(),
    platform,
    hostname: hostname(),
    nodePath: process.execPath,
    scriptPath: resolveScript(process.argv[1]),
    out: {
      line: (text = '') => {
        process.stdout.write(`${text}\n`);
      },
      error: (text) => {
        process.stderr.write(`${text}\n`);
      },
    },
    fetch: globalThis.fetch.bind(globalThis),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    openUrl: (url) => {
      const opener = openerFor(platform);
      if (!opener) return;
      execFile(opener, [url], () => undefined).on('error', () => undefined);
    },
    run: runCommand,
    now: () => Date.now(),
  };
}
