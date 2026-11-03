export const CLAUDE_SECRET = 'TOP_SECRET_PROMPT_TEXT';
export const CLAUDE_CWD = '/Users/someone/secret-project';

function assistant(id: string, requestId: string | null, output: number, extra: Record<string, unknown> = {}): string {
  return JSON.stringify({
    type: 'assistant',
    cwd: CLAUDE_CWD,
    gitBranch: 'feature/secret-branch',
    sessionId: 'session-one',
    timestamp: '2026-10-01T10:00:00.000Z',
    ...(requestId ? { requestId } : {}),
    message: {
      id,
      model: 'claude-test-model',
      role: 'assistant',
      content: [{ type: 'text', text: CLAUDE_SECRET }],
      usage: {
        input_tokens: 10,
        output_tokens: output,
        cache_read_input_tokens: 1000,
        cache_creation_input_tokens: 200,
        output_tokens_details: { thinking_tokens: 20 },
      },
    },
    ...extra,
  });
}

export const claudeMainSession = [
  JSON.stringify({ type: 'user', cwd: CLAUDE_CWD, message: { role: 'user', content: CLAUDE_SECRET } }),
  assistant('msg_011AAAAAAAAAAAAAAAAAAAAA', 'req_011AAAAAAAAAAAAAAAAAAAAA', 5),
  assistant('msg_011AAAAAAAAAAAAAAAAAAAAA', 'req_011AAAAAAAAAAAAAAAAAAAAA', 50),
  assistant('msg_011AAAAAAAAAAAAAAAAAAAAA', 'req_011AAAAAAAAAAAAAAAAAAAAA', 12),
  JSON.stringify({
    type: 'assistant',
    timestamp: '2026-10-01T10:01:00.000Z',
    message: { id: 'msg_synthetic_000000', model: '<synthetic>', usage: { input_tokens: 0, output_tokens: 0 } },
  }),
  '{"type":"assistant","message":{"usage": broken',
  '',
  assistant('msg_011BBBBBBBBBBBBBBBBBBBBB', null, 7, { timestamp: '2026-10-02T08:30:00.000Z' }),
];

export const claudeSubagentSession = [
  assistant('msg_011AAAAAAAAAAAAAAAAAAAAA', 'req_011AAAAAAAAAAAAAAAAAAAAA', 50),
  assistant('msg_011CCCCCCCCCCCCCCCCCCCCC', 'req_011CCCCCCCCCCCCCCCCCCCCC', 30, { timestamp: '2026-10-03T12:00:00.000Z' }),
];
