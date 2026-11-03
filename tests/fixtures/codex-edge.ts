import {
  CODEX_FORK_ID,
  CODEX_LEGACY_ID,
  CODEX_SESSION_ID,
  CODEX_SPAWN_ID,
  codexLine,
  sum,
  tokenCountPayload,
  usageRecordPayload,
  type Usage,
} from './codex';

const at = (base: string, ms: number): string => new Date(Date.parse(base) + ms).toISOString();

const callOne: Usage = { input: 1200, cached: 200, output: 300, reasoning: 100 };
const callTwo: Usage = { input: 400, cached: 0, output: 100, reasoning: 0 };
const afterReset: Usage = { input: 250, cached: 0, output: 50, reasoning: 0 };
const deltaOnly: Usage = { input: 400, cached: 0, output: 50, reasoning: 0 };

const LEGACY_START = '2026-09-01T09:00:00.000Z';
const legacyTwo = sum(callOne, callTwo);

export const codexLegacySession = [
  codexLine(0, 'session_meta', { id: CODEX_LEGACY_ID }, LEGACY_START),
  codexLine(1, 'turn_context', { model: 'gpt-legacy' }, at(LEGACY_START, 1000)),
  codexLine(2, 'event_msg', tokenCountPayload(callOne, callOne), at(LEGACY_START, 5000)),
  codexLine(3, 'event_msg', tokenCountPayload(callOne, callOne), at(LEGACY_START, 5001)),
  codexLine(4, 'event_msg', tokenCountPayload(callOne, callTwo), at(LEGACY_START, 5002)),
  codexLine(5, 'event_msg', tokenCountPayload(legacyTwo, callTwo), at(LEGACY_START, 9000)),
  codexLine(6, 'event_msg', tokenCountPayload(afterReset, afterReset), at(LEGACY_START, 20000)),
  codexLine(7, 'event_msg', tokenCountPayload(sum(afterReset, deltaOnly), null), at(LEGACY_START, 30000)),
];

const FORK_START = '2026-10-02T12:00:00.000Z';
const ownCall: Usage = { input: 900, cached: 500, output: 70, reasoning: 10 };

export const codexForkSession = [
  codexLine(0, 'session_meta', { id: CODEX_FORK_ID, forked_from_id: CODEX_SESSION_ID }, FORK_START),
  codexLine(1, 'turn_context', { model: 'gpt-fork' }, at(FORK_START, 1)),
  codexLine(2, 'event_msg', tokenCountPayload(callOne, callOne), at(FORK_START, 1)),
  codexLine(3, 'token_usage_record', usageRecordPayload(CODEX_FORK_ID, 'resp_copied', callTwo), at(FORK_START, 2)),
  codexLine(4, 'event_msg', tokenCountPayload(legacyTwo, callTwo), at(FORK_START, 2)),
  codexLine(5, 'response_item', { type: 'message', content: [{ text: 'next' }] }, at(FORK_START, 3000)),
  codexLine(6, 'token_usage_record', usageRecordPayload(CODEX_FORK_ID, 'resp_own', ownCall), at(FORK_START, 6000)),
  codexLine(7, 'event_msg', tokenCountPayload(sum(legacyTwo, ownCall), ownCall), at(FORK_START, 6001)),
  codexLine(8, 'token_usage_record', usageRecordPayload(CODEX_SESSION_ID, 'resp_foreign', ownCall), at(FORK_START, 9000)),
];

const SPAWN_START = '2026-10-02T13:00:00.000Z';
const spawnCall: Usage = { input: 300, cached: 0, output: 40, reasoning: 0 };

export const codexSpawnSession = [
  codexLine(0, 'session_meta', { id: CODEX_SPAWN_ID, source: { subagent: { thread_spawn: { parent_thread_id: CODEX_SESSION_ID } } } }, SPAWN_START),
  codexLine(1, 'turn_context', { model: 'gpt-spawn' }, at(SPAWN_START, 1)),
  codexLine(2, 'event_msg', tokenCountPayload(callOne, callOne), '2026-10-01T10:01:00.000Z'),
  codexLine(3, 'event_msg', tokenCountPayload(sum(callOne, spawnCall), spawnCall), at(SPAWN_START, 8000)),
];
