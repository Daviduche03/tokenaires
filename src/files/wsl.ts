import { win32 } from 'node:path';
import { listDir } from '@/files/walk';

const SHARES = ['\\\\wsl.localhost\\', '\\\\wsl$\\'];
const UTILITY_DISTRO = /^(docker-desktop|podman-machine|rancher-desktop)/;

export type DirLister = (dir: string) => Promise<string[]>;

export async function wslHomes(platform: NodeJS.Platform, list: DirLister = listDir): Promise<string[]> {
  if (platform !== 'win32') return [];
  for (const share of SHARES) {
    const distros = (await list(share)).filter((name) => !UTILITY_DISTRO.test(name));
    if (distros.length === 0) continue;
    const homes: string[] = [];
    for (const distro of distros) {
      const base = win32.join(share, distro);
      const users = await list(win32.join(base, 'home'));
      homes.push(...users.map((user) => win32.join(base, 'home', user)), win32.join(base, 'root'));
    }
    return homes;
  }
  return [];
}
