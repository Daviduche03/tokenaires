export const GEMINI_SECRET = 'GEMINI_SECRET_PROMPT_TEXT';
export const GEMINI_SESSION = '0f1e2d3c-4b5a-4968-8776-655443322110';
export const GEMINI_CHILD_SESSION = '1a2b3c4d-5e6f-4a1b-8c2d-3e4f5a6b7c8d';
export const GEMINI_MESSAGE = '9a8b7c6d-5e4f-4a3b-9c2d-1e0f9a8b7c6d';
export const GEMINI_SECOND = '8b7c6d5e-4f3a-4b2c-8d1e-0f9a8b7c6d5e';

const metadata = (sessionId: string): string =>
  JSON.stringify({ sessionId, projectHash: 'secret-project-hash', startTime: '2026-10-05T08:00:00.000Z', lastUpdated: '2026-10-05T08:10:00.000Z', kind: 'main' });

const tokens = { input: 1000, output: 120, cached: 600, thoughts: 30, tool: 15, total: 1165 };

export const geminiMessage = (id: string, extra: Record<string, unknown>): Record<string, unknown> => ({
  id,
  timestamp: '2026-10-05T08:01:00.000Z',
  type: 'gemini',
  content: [{ text: GEMINI_SECRET }],
  model: 'gemini-test-pro',
  ...extra,
});

export const geminiSession = [
  metadata(GEMINI_SESSION),
  JSON.stringify({ id: 'u-1', timestamp: '2026-10-05T08:00:30.000Z', type: 'user', content: [{ text: GEMINI_SECRET }] }),
  JSON.stringify(geminiMessage(GEMINI_MESSAGE, {})),
  JSON.stringify(geminiMessage(GEMINI_MESSAGE, { tokens })),
  JSON.stringify({ $set: { lastUpdated: '2026-10-05T08:02:00.000Z' } }),
  JSON.stringify(geminiMessage(GEMINI_SECOND, { timestamp: '2026-10-05T08:03:00.000Z', tokens: { input: 50, output: 5, cached: 0, thoughts: 0, tool: 7, total: 62 } })),
  JSON.stringify(geminiMessage('short', { tokens })),
  JSON.stringify({ id: 'info-1', type: 'info', content: 'note' }),
];

export const geminiLegacy = JSON.stringify({
  sessionId: GEMINI_SESSION,
  startTime: '2026-10-05T08:00:00.000Z',
  messages: [geminiMessage(GEMINI_MESSAGE, { tokens })],
});

export const geminiChild = [
  metadata(GEMINI_CHILD_SESSION),
  JSON.stringify(geminiMessage(GEMINI_MESSAGE, { model: 'gemini-test-flash', tokens: { input: 10, output: 4, cached: 0, thoughts: 0, total: 14 } })),
];
