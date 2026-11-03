export const OPENCODE_SECRET = 'OPENCODE_SECRET_PROMPT';

export interface Tokens {
  input: number;
  output: number;
  reasoning: number;
  cache: { read: number; write: number };
  total?: number;
}

export const tokens = (input: number, output: number, reasoning: number, read: number, write: number, total?: number): Tokens => ({
  input,
  output,
  reasoning,
  cache: { read, write },
  ...(total === undefined ? {} : { total }),
});

export function legacyAssistant(id: string, created: number, value: Tokens, model = 'claude-test-sonnet'): Record<string, unknown> {
  return { id, sessionID: 'ses_secretsession01', role: 'assistant', modelID: model, providerID: 'anthropic', cost: 0.01, time: { created, completed: created + 900 }, tokens: value, path: { cwd: '/Users/someone/opencode-secret' } };
}

export const legacyUser = { id: 'msg_user000000000001', sessionID: 'ses_secretsession01', role: 'user', time: { created: 1_790_000_000_000 }, summary: { title: OPENCODE_SECRET } };

export function v2Assistant(created: number, value: Tokens): Record<string, unknown> {
  return { model: { id: 'gpt-test-codex', providerID: 'openai' }, cost: 0.02, tokens: value, content: [{ type: 'text', text: OPENCODE_SECRET }], time: { created } };
}
