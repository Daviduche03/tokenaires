export const QWEN_SECRET = 'QWEN_SECRET_PROMPT_TEXT';
export const QWEN_SESSION = '3c2b1a09-8f7e-4d6c-9b5a-4f3e2d1c0b9a';
export const QWEN_BRANCH_SESSION = '7a6b5c4d-3e2f-4a1b-8c9d-0e1f2a3b4c5d';
export const QWEN_OPENAI = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
export const QWEN_GEMINI = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
export const QWEN_AGENT_TURN = 'c3d4e5f6-a7b8-4c9d-8e1f-2a3b4c5d6e7f';
export const QWEN_LEGACY = 'd4e5f6a7-b8c9-4d0e-9f2a-3b4c5d6e7f80';
export const QWEN_AGENT_ID = 'explore-7f3c';

export const qwenAssistant = (uuid: string, extra: Record<string, unknown>): Record<string, unknown> => ({
  uuid,
  parentUuid: 'u-0001-parent',
  sessionId: QWEN_SESSION,
  timestamp: '2026-10-06T09:01:00.000Z',
  type: 'assistant',
  provenance: 'assistant_output',
  cwd: '/Users/someone/secret-project',
  version: '0.9.0',
  model: 'qwen3-coder-plus',
  message: { role: 'model', parts: [{ text: QWEN_SECRET }, { text: QWEN_SECRET, thought: true }] },
  usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 150, cachedContentTokenCount: 600, thoughtsTokenCount: 30, totalTokenCount: 1150 },
  contextWindowSize: 1000000,
  ...extra,
});

const geminiUsage = { promptTokenCount: 200, candidatesTokenCount: 40, cachedContentTokenCount: 0, thoughtsTokenCount: 25, totalTokenCount: 265 };

export const qwenSession = [
  JSON.stringify({ uuid: 'f0e1d2c3-0000-4000-8000-000000000001', parentUuid: null, sessionId: QWEN_SESSION, timestamp: '2026-10-06T09:00:00.000Z', type: 'user', cwd: '/Users/someone/secret-project', version: '0.9.0', message: { role: 'user', parts: [{ text: QWEN_SECRET }] } }),
  JSON.stringify(qwenAssistant(QWEN_OPENAI, {})),
  JSON.stringify({ uuid: 'f0e1d2c3-0000-4000-8000-000000000002', sessionId: QWEN_SESSION, timestamp: '2026-10-06T09:01:30.000Z', type: 'tool_result', message: { role: 'user', parts: [{ functionResponse: { response: { output: QWEN_SECRET } } }] } }),
  JSON.stringify(qwenAssistant(QWEN_GEMINI, { timestamp: '2026-10-06T09:02:00.000Z', model: 'gemini-2.5-pro', usageMetadata: geminiUsage })),
  JSON.stringify(qwenAssistant('f0e1d2c3-0000-4000-8000-000000000003', { subtype: 'realtime_message', usageMetadata: undefined })),
  JSON.stringify(qwenAssistant('f0e1d2c3-0000-4000-8000-000000000004', { model: undefined })),
  JSON.stringify(qwenAssistant('short', {})),
  JSON.stringify(qwenAssistant('f0e1d2c3-0000-4000-8000-000000000005', { uuid: undefined })),
  JSON.stringify({ uuid: 'f0e1d2c3-0000-4000-8000-000000000006', sessionId: QWEN_SESSION, timestamp: '2026-10-06T09:03:00.000Z', type: 'system', subtype: 'ui_telemetry', systemPayload: { uiEvent: { usageMetadata: { promptTokenCount: 5 } } } }),
  '{"type":"assistant","usageMetadata":',
];

export const qwenBranch = [
  JSON.stringify({ uuid: 'f0e1d2c3-0000-4000-8000-000000000001', parentUuid: null, sessionId: QWEN_BRANCH_SESSION, timestamp: '2026-10-06T09:00:00.000Z', type: 'user', message: { role: 'user', parts: [{ text: QWEN_SECRET }] }, forkedFrom: { sessionId: QWEN_SESSION, messageUuid: 'f0e1d2c3-0000-4000-8000-000000000001' } }),
  JSON.stringify(qwenAssistant(QWEN_OPENAI, { sessionId: QWEN_BRANCH_SESSION, cwd: '/Users/someone/other', parentUuid: 'f0e1d2c3-0000-4000-8000-000000000001', forkedFrom: { sessionId: QWEN_SESSION, messageUuid: QWEN_OPENAI } })),
];

export const qwenAgent = [
  JSON.stringify({ uuid: 'f0e1d2c3-0000-4000-8000-000000000007', parentUuid: null, sessionId: QWEN_SESSION, timestamp: '2026-10-06T09:04:00.000Z', type: 'user', message: { role: 'user', parts: [{ text: QWEN_SECRET }] }, agentId: QWEN_AGENT_ID, isSidechain: true }),
  JSON.stringify({
    uuid: QWEN_AGENT_TURN,
    parentUuid: 'f0e1d2c3-0000-4000-8000-000000000007',
    sessionId: QWEN_SESSION,
    timestamp: '2026-10-06T09:05:00.000Z',
    type: 'assistant',
    agentId: QWEN_AGENT_ID,
    agentName: 'Explore',
    isSidechain: true,
    agentRunId: 'run-0001',
    agentRound: 1,
    message: { role: 'model', parts: [{ text: QWEN_SECRET }] },
    usageMetadata: { promptTokenCount: 80, candidatesTokenCount: 12, cachedContentTokenCount: 20, totalTokenCount: 92 },
  }),
];

export const qwenAgentMeta = JSON.stringify({
  agentId: QWEN_AGENT_ID,
  agentType: 'Explore',
  description: QWEN_SECRET,
  parentSessionId: QWEN_SESSION,
  parentAgentId: null,
  createdAt: '2026-10-06T09:04:00.000Z',
  persistedCliFlags: { model: 'qwen3-coder-flash' },
});

export const qwenLegacy = JSON.stringify({
  sessionId: QWEN_SESSION,
  projectHash: 'secret-project-hash',
  startTime: '2025-09-01T08:00:00.000Z',
  lastUpdated: '2025-09-01T08:10:00.000Z',
  messages: [
    { id: 'e5f6a7b8-0000-4000-8000-000000000001', timestamp: '2025-09-01T08:00:30.000Z', type: 'user', content: [{ text: QWEN_SECRET }] },
    { id: QWEN_LEGACY, timestamp: '2025-09-01T08:01:00.000Z', type: 'qwen', content: QWEN_SECRET, model: 'qwen3-coder-plus', tokens: { input: 500, output: 60, cached: 100, thoughts: 0, tool: 0, total: 560 } },
    { id: 'e5f6a7b8-0000-4000-8000-000000000002', timestamp: '2025-09-01T08:02:00.000Z', type: 'qwen', content: QWEN_SECRET, model: 'qwen3-coder-plus' },
  ],
});
