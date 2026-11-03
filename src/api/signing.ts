import { createHash, createPrivateKey, generateKeyPairSync, sign } from 'node:crypto';

export interface DeviceKeys {
  publicKey: string;
  privateKeyPem: string;
}

export interface SignedHeaders {
  timestamp: string;
  signature: string;
}

export function generateDeviceKeys(): DeviceKeys {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return {
    publicKey: publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
    privateKeyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }),
  };
}

export function sha256Hex(body: string): string {
  return createHash('sha256').update(body, 'utf8').digest('hex');
}

export function signingMessage(timestamp: string, body: string): string {
  return `${timestamp}.${sha256Hex(body)}`;
}

export function signBody(privateKeyPem: string, body: string, now: number): SignedHeaders {
  const timestamp = String(now);
  const key = createPrivateKey(privateKeyPem);
  const signature = sign(null, Buffer.from(signingMessage(timestamp, body), 'utf8'), key).toString('base64');
  return { timestamp, signature };
}
