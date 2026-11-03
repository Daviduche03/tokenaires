export const API_PREFIX = 'api/v1';
export const JSON_BODY_LIMIT = '1mb';
export const API_TOKEN_PREFIX = 'tka_';
export const API_TOKEN_LENGTH = 40;
export const DEVICE_SESSION_TTL_SECONDS = 900;
export const DEVICE_SESSION_INTERVAL_SECONDS = 5;
export const USER_CODE_ALPHABET = 'BCDFGHJKLMNPQRSTVWXZ23456789';
export const DEV_DEFAULT_HANDLE = 'localdev';
export const PROFILE_DAILY_DAYS = 365;
export const PROFILE_TOP_MODELS = 8;
export const MOVEMENT_WINDOW_DAYS = 7;
export const BOARD_WINDOWS_DAYS = { week: 7, month: 30 } as const;
export const BOARD_CACHE_SECONDS = 30;

export const GITHUB = {
  deviceCodeUrl: 'https://github.com/login/device/code',
  accessTokenUrl: 'https://github.com/login/oauth/access_token',
  userUrl: 'https://api.github.com/user',
  deviceGrantType: 'urn:ietf:params:oauth:grant-type:device_code',
} as const;

export const THROTTLE = {
  default: { ttl: 60_000, limit: 120 },
  ingest: { ttl: 60_000, limit: 60 },
  devicePoll: { ttl: 60_000, limit: 30 },
} as const;
