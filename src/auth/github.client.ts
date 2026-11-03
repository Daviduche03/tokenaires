import { BadGatewayException, Injectable } from '@nestjs/common';
import { GITHUB } from '../config/constants';
import { GithubIdentity } from './auth.repository';

export interface GithubDeviceCode {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
}

export type GithubTokenPoll =
  | { kind: 'pending' }
  | { kind: 'slow_down'; interval: number }
  | { kind: 'expired' }
  | { kind: 'denied' }
  | { kind: 'token'; accessToken: string };

type JsonObject = Record<string, unknown>;

async function postForm(
  url: string,
  body: Record<string, string>,
): Promise<JsonObject> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
  });
  if (!response.ok)
    throw new BadGatewayException('GitHub sign-in is unavailable right now');
  return (await response.json()) as JsonObject;
}

const text = (value: unknown): string | null =>
  typeof value === 'string' ? value : null;
const integer = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

@Injectable()
export class GithubClient {
  async requestDeviceCode(clientId: string): Promise<GithubDeviceCode> {
    const data = await postForm(GITHUB.deviceCodeUrl, {
      client_id: clientId,
      scope: '',
    });
    const deviceCode = text(data.device_code);
    const userCode = text(data.user_code);
    const verificationUri = text(data.verification_uri);
    if (!deviceCode || !userCode || !verificationUri) {
      throw new BadGatewayException('GitHub did not return a device code');
    }
    return {
      deviceCode,
      userCode,
      verificationUri,
      expiresIn: integer(data.expires_in, 900),
      interval: integer(data.interval, 5),
    };
  }

  async pollAccessToken(
    clientId: string,
    deviceCode: string,
  ): Promise<GithubTokenPoll> {
    const data = await postForm(GITHUB.accessTokenUrl, {
      client_id: clientId,
      device_code: deviceCode,
      grant_type: GITHUB.deviceGrantType,
    });
    const accessToken = text(data.access_token);
    if (accessToken) return { kind: 'token', accessToken };
    switch (text(data.error)) {
      case 'authorization_pending':
        return { kind: 'pending' };
      case 'slow_down':
        return { kind: 'slow_down', interval: integer(data.interval, 10) };
      case 'expired_token':
        return { kind: 'expired' };
      case 'access_denied':
        return { kind: 'denied' };
      default:
        throw new BadGatewayException('GitHub sign-in failed');
    }
  }

  async fetchIdentity(accessToken: string): Promise<GithubIdentity> {
    const response = await fetch(GITHUB.userUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'tokenaires',
      },
    });
    if (!response.ok)
      throw new BadGatewayException('Could not read your GitHub profile');
    const data = (await response.json()) as JsonObject;
    const login = text(data.login);
    if (typeof data.id !== 'number' || !login) {
      throw new BadGatewayException('GitHub returned an unexpected profile');
    }
    return {
      githubId: data.id,
      handle: login,
      name: text(data.name),
      avatarUrl: text(data.avatar_url),
    };
  }
}
