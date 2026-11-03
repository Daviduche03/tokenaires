import { readFile } from 'node:fs/promises';
import type { UsageRecord } from '@tokenaires/contracts';
import { eachLine } from '@/files/lines';
import { bytesHave, child, count, isObject, isoTime, markerBuffers, nativeId, parseObject, text, type JsonObject } from '@/parsers/json';
import { hasTokens } from '@/parsers/merge';

const GEMINI_TYPE = 'gemini';
const LEGACY_SUFFIX = '.json';
const MARKERS = markerBuffers('"tokens"', '"sessionId"');

interface GeminiSession {
  sessionId: string | null;
  messages: Map<string, JsonObject>;
}

function inputTokens(tokens: JsonObject): number {
  const prompt = count(tokens, 'input');
  const fresh = Math.max(0, prompt - count(tokens, 'cached'));
  const tool = count(tokens, 'tool');
  const total = count(tokens, 'total');
  const withoutTool = prompt + count(tokens, 'output') + count(tokens, 'thoughts');
  return total === withoutTool + tool ? fresh + tool : fresh;
}

export function geminiRecord(sessionId: string, message: JsonObject): UsageRecord | null {
  if (message.type !== GEMINI_TYPE) return null;
  const tokens = child(message, 'tokens');
  const model = text(message, 'model');
  const recordId = nativeId(sessionId, text(message, 'id'));
  const occurredAt = isoTime(message.timestamp);
  if (!tokens || !model || !recordId || !occurredAt) return null;
  const thoughts = count(tokens, 'thoughts');
  const record: UsageRecord = {
    source: 'gemini-cli',
    recordId,
    model,
    occurredAt,
    inputTokens: inputTokens(tokens),
    outputTokens: count(tokens, 'output') + thoughts,
    cacheReadTokens: count(tokens, 'cached'),
    cacheWriteTokens: 0,
    reasoningTokens: thoughts,
  };
  return hasTokens(record) ? record : null;
}

function addEntry(session: GeminiSession, entry: JsonObject): void {
  if (entry.$set !== undefined) return;
  const id = text(entry, 'id');
  if (id && typeof entry.type === 'string') {
    session.messages.set(id, entry);
    return;
  }
  session.sessionId ??= text(entry, 'sessionId');
}

async function readLegacy(path: string, session: GeminiSession): Promise<boolean> {
  try {
    const parsed = parseObject(await readFile(path, 'utf8'));
    if (!parsed) return true;
    session.sessionId = text(parsed, 'sessionId');
    const messages = Array.isArray(parsed.messages) ? parsed.messages : [];
    for (const message of messages) if (isObject(message)) addEntry(session, message);
    return true;
  } catch {
    return false;
  }
}

export async function parseGeminiFile(path: string): Promise<UsageRecord[] | null> {
  const session: GeminiSession = { sessionId: null, messages: new Map() };
  const ok = path.endsWith(LEGACY_SUFFIX)
    ? await readLegacy(path, session)
    : await eachLine(path, (line) => {
        if (!bytesHave(line, MARKERS)) return;
        const entry = parseObject(line.toString('utf8'));
        if (entry) addEntry(session, entry);
      });
  if (!ok) return null;
  const sessionId = session.sessionId;
  if (!sessionId) return [];
  return [...session.messages.values()].flatMap((message) => geminiRecord(sessionId, message) ?? []);
}
