import { sep } from 'node:path';
import { findAll, type FileFilter } from '@/files/walk';
import { parseGeminiFile } from '@/parsers/gemini';
import { geminiTmpRoot } from '@/parsers/paths';
import type { LogSource } from '@/sources/types';

const CHATS = `${sep}chats${sep}`;

const isChatFile: FileFilter = (path, name) => path.includes(CHATS) && (name.endsWith('.jsonl') || name.endsWith('.json'));

export const geminiSource: LogSource = {
  source: 'gemini-cli',
  discover: (ctx) => findAll([geminiTmpRoot(ctx.env, ctx.home)], isChatFile),
  parse: parseGeminiFile,
};
