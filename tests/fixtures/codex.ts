export const CODEX_SECRET = 'CODEX_SECRET_PROMPT_TEXT';
export const CODEX_SESSION_ID = '01a00000-0000-7000-8000-000000000001';
export const CODEX_CHILD_ID = '01a00000-0000-7000-8000-000000000002';
export const CODEX_MAIN_FILE = `rollout-2026-10-01T10-00-00-${CODEX_SESSION_ID}.jsonl`;
export const CODEX_CHILD_FILE = `rollout-2026-10-01T11-00-00-${CODEX_SESSION_ID}_${CODEX_CHILD_ID}.jsonl`;

interface Usage {
  input: number;
  cached: number;
  output: number;
  reasoning: number;
}

function usage(value: Usage): Record<string, number> {
  return {
    input_tokens: value.input,
    cached_input_tokens: value.cached,
    cache_write_input_tokens: 0,
    output_tokens: value.output,
    reasoning_output_tokens: value.reasoning,
    total_tokens: value.input + value.output,
  };
}

function line(ordinal: number | null, type: string, payload: unknown, minute = 0): string {
  const timestamp = `2026-10-01T10:${String(minute).padStart(2, '0')}:00.000Z`;
  return JSON.stringify({ timestamp, ...(ordinal === null ? {} : { ordinal }), type, payload });
}

function tokenCount(ordinal: number | null, total: Usage, last: Usage, minute: number): string {
  return line(ordinal, 'event_msg', { type: 'token_count', info: { total_token_usage: usage(total), last_token_usage: usage(last), model_context_window: 1 } }, minute);
}

function usageRecord(ordinal: number | null, value: Usage, minute: number): string {
  return line(ordinal, 'token_usage_record', { response_id: `resp_${ordinal ?? 'x'}`, thread_id: CODEX_SESSION_ID, usage: usage(value) }, minute);
}

const first: Usage = { input: 1000, cached: 800, output: 100, reasoning: 40 };
const second: Usage = { input: 450, cached: 0, output: 50, reasoning: 0 };
const compaction: Usage = { input: 250, cached: 0, output: 50, reasoning: 0 };
const runningTotal = (a: Usage, b: Usage): Usage => ({
  input: a.input + b.input,
  cached: a.cached + b.cached,
  output: a.output + b.output,
  reasoning: a.reasoning + b.reasoning,
});

export const codexMainSession = [
  line(0, 'session_meta', { id: CODEX_SESSION_ID, cwd: '/Users/someone/codex-secret', base_instructions: CODEX_SECRET, git: { branch: 'secret' } }),
  line(1, 'turn_context', { model: 'gpt-test-1', cwd: '/Users/someone/codex-secret' }),
  line(2, 'response_item', { type: 'message', content: [{ text: CODEX_SECRET }] }),
  line(3, 'event_msg', { type: 'token_count', info: null }),
  usageRecord(4, first, 1),
  tokenCount(5, first, first, 1),
  tokenCount(6, first, first, 2),
  line(7, 'turn_context', { model: 'gpt-test-2' }),
  tokenCount(8, runningTotal(first, second), second, 3),
  usageRecord(9, compaction, 4),
  '{"type":"token_usage_record", nope',
];

export const codexChildSession = [
  line(null, 'session_meta', { id: CODEX_SESSION_ID }),
  line(null, 'turn_context', { model: 'gpt-test-child' }),
  tokenCount(null, second, second, 5),
];
