export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  corsOrigins: string[];
  apiPublicUrl: string;
  webUrl: string;
  githubClientId: string | null;
  authDevLogin: boolean;
}

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

export function loadConfig(): AppConfig {
  const env = process.env;
  const nodeEnv = env.NODE_ENV ?? 'development';
  const authDevLogin = env.AUTH_DEV_LOGIN === 'true';
  if (authDevLogin && nodeEnv === 'production') {
    throw new Error('AUTH_DEV_LOGIN cannot be enabled in production');
  }
  const githubClientId = env.GITHUB_CLIENT_ID || null;
  if (!githubClientId && !authDevLogin) {
    throw new Error(
      'Set GITHUB_CLIENT_ID, or AUTH_DEV_LOGIN=true for local development',
    );
  }
  const port = Number(env.PORT ?? 7020);
  return {
    nodeEnv,
    port,
    databaseUrl: required('DATABASE_URL', env.DATABASE_URL),
    corsOrigins: (env.CORS_ORIGINS ?? 'http://localhost:7021')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    apiPublicUrl: env.API_PUBLIC_URL ?? `http://localhost:${port}/api/v1`,
    webUrl: env.WEB_URL ?? 'http://localhost:7021',
    githubClientId,
    authDevLogin,
  };
}

export default () => ({ app: loadConfig() });
