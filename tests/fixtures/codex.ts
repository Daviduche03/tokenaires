export const CODEX_SECRET = 'CODEX_SECRET_PROMPT_TEXT';
export const CODEX_SESSION_ID = '01a00000-0000-7000-8000-000000000001';
export const CODEX_CHILD_ID = '01a00000-0000-7000-8000-000000000002';
export const CODEX_LEGACY_ID = '01a00000-0000-7000-8000-000000000003';
export const CODEX_FORK_ID = '01a00000-0000-7000-8000-000000000004';
export const CODEX_SPAWN_ID = '01a00000-0000-7000-8000-000000000005';
export const CODEX_MAIN_FILE = `rollout-2026-10-01T10-00-00-${CODEX_SESSION_ID}.jsonl`;
export const CODEX_CHILD_FILE = `rollout-2026-10-01T11-00-00-${CODEX_SESSION_ID}_${CODEX_CHILD_ID}.jsonl`;
export const CODEX_LEGACY_FILE = `rollout-2026-09-01T09-00-00-${CODEX_LEGACY_ID}.jsonl`;
export const CODEX_FORK_FILE = `rollout-2026-10-02T12-00-00-${CODEX_FORK_ID}.jsonl`;
export const CODEX_SPAWN_FILE = `rollout-2026-10-02T13-00-00-${CODEX_SPAWN_ID}.jsonl`;

export interface Usage {
  input: number;
  cached: number;
  output: number;
  reasoning: number;
  cacheWrite?: number;
}

export function usage(value: Usage): Record<string, number> {
  return {
    input_tokens: value.input,
    cached_input_tokens: value.cached,
    cache_write_input_tokens: value.cacheWrite ?? 0,
    output_tokens: value.output,
    reasoning_output_tokens: value.reasoning,
    total_tokens: value.input + value.output,
  };
}

export function codexLine(ordinal: number | null, type: string, payload: unknown, timestamp: string): string {
  return JSON.stringify({ timestamp, ...(ordinal === null ? {} : { ordinal }), type, payload });
}

const minute = (value: number): string => `2026-10-01T10:${String(value).padStart(2, '0')}:00.000Z`;

function line(ordinal: number | null, type: string, payload: unknown, at = 0): string {
  return codexLine(ordinal, type, payload, minute(at));
}

export function tokenCountPayload(total: Usage, last: Usage | null): Record<string, unknown> {
  const info = { total_token_usage: usage(total), ...(last ? { last_token_usage: usage(last) } : {}), model_context_window: 1 };
  return { type: 'token_count', info };
}

export function usageRecordPayload(thread: string, response: string, value: Usage): Record<string, unknown> {
  return { thread_id: thread, response_id: response, usage: usage(value) };
}

export const sum = (a: Usage, b: Usage): Usage => ({
  input: a.input + b.input,
  cached: a.cached + b.cached,
  output: a.output + b.output,
  reasoning: a.reasoning + b.reasoning,
});

const first: Usage = { input: 1000, cached: 800, output: 100, reasoning: 40 };
const compaction: Usage = { input: 250, cached: 0, output: 50, reasoning: 0 };
const afterCompaction: Usage = { input: 600, cached: 0, output: 30, reasoning: 0 };
const second: Usage = { input: 450, cached: 0, output: 50, reasoning: 0 };

export const codexMainSession = [
  line(0, 'session_meta', { id: CODEX_SESSION_ID, cwd: '/Users/someone/codex-secret', base_instructions: CODEX_SECRET, git: { branch: 'secret' } }),
  line(1, 'turn_context', { model: 'gpt-test-1', cwd: '/Users/someone/codex-secret' }),
  line(2, 'response_item', { type: 'message', content: [{ text: CODEX_SECRET }] }),
  line(3, 'event_msg', { type: 'token_count', info: null }),
  line(4, 'token_usage_record', usageRecordPayload(CODEX_SESSION_ID, 'resp_first', first), 1),
  line(5, 'event_msg', tokenCountPayload(first, first), 1),
  line(6, 'event_msg', tokenCountPayload(first, first), 2),
  line(7, 'turn_context', { model: 'gpt-test-2' }),
  line(8, 'token_usage_record', usageRecordPayload(CODEX_SESSION_ID, 'resp_compact', compaction), 3),
  line(9, 'compacted', { message: CODEX_SECRET }, 3),
  line(10, 'event_msg', tokenCountPayload(sum(first, afterCompaction), afterCompaction), 3),
  line(11, 'token_usage_record', usageRecordPayload(CODEX_SESSION_ID, 'resp_second', second), 4),
  line(12, 'event_msg', tokenCountPayload(sum(sum(first, afterCompaction), second), second), 4),
  '{"type":"token_usage_record", nope',
];

export const codexChildSession = [
  line(null, 'session_meta', { id: CODEX_SESSION_ID }),
  line(null, 'turn_context', { model: 'gpt-test-child' }),
  line(null, 'event_msg', tokenCountPayload(second, second), 5),
];
