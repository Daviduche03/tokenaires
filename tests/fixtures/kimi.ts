export const KIMI_SECRET = 'KIMI_SECRET_PROMPT_TEXT';
export const KIMI_SESSION = 'session_9681c707-224e-45a2-8870-0a1633dc0c4c';
export const KIMI_FORK = 'session_5bd17ef5-207c-41f7-a10b-491ee243816d';
export const KIMI_MODEL = 'kimi-code/kimi-for-coding';

export const kimiUsage = (time: number, usage: Record<string, unknown>, extra: Record<string, unknown> = {}): string =>
  JSON.stringify({ type: 'usage.record', agentId: 'main', model: KIMI_MODEL, usage, usageScope: 'turn', time, ...extra });

const prompt = JSON.stringify({ type: 'context.append_message', agentId: 'main', message: { role: 'user', content: KIMI_SECRET }, time: 1793306721300 });

export const kimiMain = [
  JSON.stringify({ type: 'metadata', protocol_version: '1.5', created_at: 1793306721177 }),
  prompt,
  JSON.stringify({ type: 'llm.request', agentId: 'main', provider: 'openai', model: 'kimi-for-coding', modelAlias: KIMI_MODEL, time: 1793306721400 }),
  kimiUsage(1793306725000, { inputOther: 1200, output: 340, inputCacheRead: 8000, inputCacheCreation: 0, raw: { completion_tokens_details: { reasoning_tokens: 90 } } }),
  JSON.stringify({ type: 'token_counting.turn_recorded', agentId: 'main', turnId: 0, length: 3, tokens: 63, time: 1793306725007 }),
  kimiUsage(1793306730000, { inputOther: 40, output: 12, inputCacheRead: 9100, inputCacheCreation: 300 }, { usageScope: 'session' }),
  kimiUsage(1793306731000, { inputOther: 0, output: 0, inputCacheRead: 0, inputCacheCreation: 0 }),
  kimiUsage(1793306732000, {}, { usage: undefined }),
];

export const kimiFork = [
  ...kimiMain,
  JSON.stringify({ type: 'forked', agentId: 'main', time: 1793400000000 }),
  kimiUsage(1793400005000, { inputOther: 70, output: 20, inputCacheRead: 500, inputCacheCreation: 0 }),
];

export const kimiSubagent = [
  JSON.stringify({ type: 'metadata', protocol_version: '1.5', created_at: 1793306726000 }),
  kimiUsage(1793306727000, { inputOther: 300, output: 50, inputCacheRead: 0, inputCacheCreation: 0 }, { agentId: 'agent-7f3a2c91' }),
];
