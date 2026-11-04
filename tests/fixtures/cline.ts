export const CLINE_SECRET = 'CLINE_SECRET_PROMPT_TEXT';
export const CLINE_TASK = '1761234567890';
export const ROO_TASK = '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b';
export const KILO_TASK = '0199b2c3-d4e5-7f6a-9b0c-1d2e3f4a5b6c';
export const SDK_SESSION = '1784094124598_rruoq';
export const SDK_FORK = '1784094999000_forky';
export const LEGACY_WARNING =
  'Warning: this is a legacy conversation, which means tool names may have changed. Please use the most up-to-date tools you are aware of.';

export const ROO_BEFORE = Date.UTC(2025, 9, 15, 10, 0, 0);
export const ROO_AFTER = Date.UTC(2025, 10, 10, 10, 0, 0);
export const KILO_BETWEEN = Date.UTC(2025, 10, 5, 10, 0, 0);
export const KILO_AFTER = Date.UTC(2025, 10, 20, 10, 0, 0);
export const CLINE_TS = Date.UTC(2026, 0, 12, 9, 0, 0);
export const SDK_TS = Date.UTC(2026, 6, 15, 5, 42, 10);

type Row = Record<string, unknown>;

export const apiRow = (ts: number, payload: Record<string, unknown>, extra: Row = {}): Row => ({
  ts,
  type: 'say',
  say: 'api_req_started',
  text: JSON.stringify({ request: `<task>${CLINE_SECRET}</task>`, ...payload }),
  ...extra,
});

const chatRows = (ts: number): Row[] => [
  { ts: ts - 1000, type: 'say', say: 'task', text: CLINE_SECRET },
  { ts: ts + 500, type: 'say', say: 'text', text: CLINE_SECRET, partial: false },
  { ts: ts + 600, type: 'ask', ask: 'followup', text: CLINE_SECRET },
];

export const clineLegacyRows = (): Row[] => [
  ...chatRows(CLINE_TS),
  apiRow(CLINE_TS, { tokensIn: 1200, tokensOut: 300, cacheReads: 5000, cacheWrites: 800, cost: 0.04 }, {
    modelInfo: { providerId: 'anthropic', modelId: 'claude-sonnet-4-5', mode: 'act' },
  }),
  apiRow(CLINE_TS + 60_000, { tokensIn: 40, tokensOut: 25, cacheReads: 6000, cacheWrites: 0, cost: 0.01, cancelReason: 'user_cancelled' }),
  apiRow(CLINE_TS + 120_000, { apiProtocol: 'anthropic' }),
  apiRow(CLINE_TS + 180_000, { tokensIn: 0, tokensOut: 50, cacheReads: 0, cacheWrites: 0 }),
  { ts: CLINE_TS + 200_000, type: 'say', say: 'subagent_usage', text: JSON.stringify({ source: 'subagents', tokensIn: 700, tokensOut: 90, cacheReads: 100, cacheWrites: 0, cost: 0.02 }) },
  { ts: CLINE_TS + 240_000, type: 'say', say: 'deleted_api_reqs', text: JSON.stringify({ tokensIn: 999, tokensOut: 999, cacheReads: 0, cacheWrites: 0, cost: 1 }) },
];

export const clineTaskMetadata = JSON.stringify({
  files_in_context: [{ path: `/secret/${CLINE_SECRET}.ts`, record_state: 'active', record_source: 'read_tool' }],
  model_usage: [
    { ts: CLINE_TS + 10, model_id: 'claude-sonnet-4-5', model_provider_id: 'anthropic', mode: 'act' },
    { ts: CLINE_TS + 60_010, model_id: 'gpt-5', model_provider_id: 'openai', mode: 'act' },
  ],
});

const envDetails = (model: string): string =>
  `<environment_details>\n# VSCode Visible Files\n${CLINE_SECRET}.ts\n\n# Current Mode\n<slug>code</slug>\n<name>Code</name>\n<model>${model}</model>\n</environment_details>`;

export const apiHistory = (marks: { ts: number; model: string }[]): string =>
  JSON.stringify(
    marks.flatMap(({ ts, model }) => [
      { role: 'user', ts, content: [{ type: 'text', text: `<task>${CLINE_SECRET} <model>evil</model></task>` }, { type: 'text', text: envDetails(model) }] },
      { role: 'assistant', ts: ts + 1, content: [{ type: 'text', text: CLINE_SECRET }] },
    ]),
  );

export const rooRows = (): Row[] => [
  ...chatRows(ROO_BEFORE),
  apiRow(ROO_BEFORE, { apiProtocol: 'anthropic', tokensIn: 300, tokensOut: 10, cacheReads: 600, cacheWrites: 100, cost: 0.1 }),
  apiRow(ROO_BEFORE + 60_000, { apiProtocol: 'openai', tokensIn: 1000, tokensOut: 10, cacheReads: 600, cacheWrites: 100, cost: 0.1 }),
  apiRow(ROO_AFTER, { apiProtocol: 'anthropic', tokensIn: 1000, tokensOut: 20, cacheReads: 600, cacheWrites: 100, cost: 0.2 }),
  apiRow(ROO_AFTER + 60_000, { tokensIn: 500, tokensOut: 5, cacheReads: 700, cacheWrites: 0 }),
];

export const kiloRows = (): Row[] => [
  ...chatRows(KILO_BETWEEN),
  apiRow(KILO_BETWEEN, { apiProtocol: 'anthropic', tokensIn: 300, tokensOut: 15, cacheReads: 600, cacheWrites: 100, cost: 0.05 }),
  apiRow(KILO_AFTER, { apiProtocol: 'anthropic', tokensIn: 1000, tokensOut: 15, cacheReads: 600, cacheWrites: 100, cost: 0.05 }),
];

const userMessage = (textValue: string, extra: Row = {}): Row => ({ id: `u-${textValue.length}`, role: 'user', content: [{ type: 'text', text: textValue }], ...extra });

const assistant = (id: string, ts: number | undefined, metrics: Row | undefined, model: string | undefined): Row => ({
  id,
  role: 'assistant',
  content: [{ type: 'text', text: CLINE_SECRET }],
  ...(ts === undefined ? {} : { ts }),
  ...(model ? { modelInfo: { id: model, provider: 'anthropic' } } : {}),
  ...(metrics ? { metrics } : {}),
});

const metrics = (input: number, output: number, cacheRead: number, cacheWrite: number): Row => ({
  inputTokens: input,
  outputTokens: output,
  cacheReadTokens: cacheRead,
  cacheWriteTokens: cacheWrite,
  cost: 0.13,
});

export const sdkSession = (): Row => ({
  version: 1,
  updated_at: '2026-07-15T05:45:00.000Z',
  agent: 'lead',
  sessionId: SDK_SESSION,
  messages: [
    userMessage(CLINE_SECRET),
    assistant('legacyAssistant1', undefined, undefined, undefined),
    assistant('legacySynthTotal', SDK_TS - 5000, metrics(90_000, 4000, 50_000, 20_000), 'claude-sonnet-4-5'),
    userMessage(LEGACY_WARNING),
    userMessage(CLINE_SECRET),
    assistant('Xa1b2c3d4e5f6g7h8', SDK_TS, undefined, 'claude-sonnet-4-6'),
    assistant('Ya1b2c3d4e5f6g7h8', SDK_TS + 100, metrics(2100, 80, 1500, 400), 'claude-sonnet-4-6'),
    userMessage(CLINE_SECRET),
    assistant('Za1b2c3d4e5f6g7h8', SDK_TS + 60_000, metrics(300, 20, 0, 0), undefined),
    assistant('_a1b2c3d4e5f6g7h8', SDK_TS + 90_000, metrics(0, 0, 0, 0), undefined),
  ],
  system_prompt: CLINE_SECRET,
});

export const sdkManifest = (sessionId: string, extra: Row = {}): Row => ({
  version: 1,
  session_id: sessionId,
  source: 'cli',
  provider: 'cline',
  model: 'mistralai/mixtral-8x22b-instruct',
  cwd: `/Users/example/${CLINE_SECRET}`,
  metadata: { title: CLINE_SECRET, ...extra },
});

export const sdkFork = (): Row => ({
  version: 1,
  agent: 'lead',
  sessionId: SDK_FORK,
  messages: [
    userMessage(CLINE_SECRET),
    assistant('Ya1b2c3d4e5f6g7h8', SDK_TS + 100, metrics(2100, 80, 1500, 400), 'claude-sonnet-4-6'),
    userMessage(CLINE_SECRET),
    assistant('Fa1b2c3d4e5f6g7h8', SDK_TS + 400_000, metrics(2500, 60, 2000, 0), undefined),
  ],
});
