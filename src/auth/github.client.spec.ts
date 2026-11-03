import { GithubClient } from './github.client';

describe('GithubClient.fetchIdentity', () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
  });

  function respondWith(body: Record<string, unknown>): void {
    global.fetch = jest
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
  }

  it('trims the display name and drops blank ones', async () => {
    respondWith({
      id: 1,
      login: 'appdever01',
      name: 'Naheem ',
      avatar_url: 'https://avatars.githubusercontent.com/u/1',
    });
    await expect(
      new GithubClient().fetchIdentity('token'),
    ).resolves.toMatchObject({ handle: 'appdever01', name: 'Naheem' });
    respondWith({ id: 2, login: 'someone', name: '   ', avatar_url: null });
    await expect(
      new GithubClient().fetchIdentity('token'),
    ).resolves.toMatchObject({ name: null, avatarUrl: null });
  });
});
