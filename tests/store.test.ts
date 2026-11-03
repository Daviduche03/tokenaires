import { stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { configPath, deleteConfig, loadConfig, saveConfig } from '@/store';
import { makeTempDir, removeDir } from './helpers/temp';

const sample = {
  apiUrl: 'http://localhost:7020/api/v1',
  token: 'token-value',
  deviceId: 'device-1',
  privateKeyPem: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
  handle: 'ada',
};

describe('config store', () => {
  let root = '';
  beforeEach(async () => {
    root = await makeTempDir('store');
  });
  afterEach(async () => {
    await removeDir(root);
  });

  it('uses XDG_CONFIG_HOME when set and ~/.config otherwise', () => {
    expect(configPath({ XDG_CONFIG_HOME: '/xdg' }, '/home/me')).toBe('/xdg/tokenaires/config.json');
    expect(configPath({}, '/home/me')).toBe('/home/me/.config/tokenaires/config.json');
  });

  it('writes the file 0600 inside a 0700 folder and reads it back', async () => {
    const path = configPath({ XDG_CONFIG_HOME: join(root, 'xdg') }, root);
    await saveConfig(path, sample);
    expect((await stat(path)).mode & 0o777).toBe(0o600);
    expect((await stat(dirname(path))).mode & 0o777).toBe(0o700);
    expect(await loadConfig(path)).toEqual(sample);
  });

  it('treats a missing or broken file as logged out and deletes cleanly', async () => {
    const path = join(root, 'none', 'config.json');
    expect(await loadConfig(path)).toBeNull();
    expect(await deleteConfig(path)).toBe(false);
    await saveConfig(path, sample);
    expect(await deleteConfig(path)).toBe(true);
    expect(await loadConfig(path)).toBeNull();
  });
});
