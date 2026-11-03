import { createHash, createPublicKey, KeyObject, verify } from 'node:crypto';

export function sha256Hex(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

export function parseDevicePublicKey(base64Spki: string): KeyObject | null {
  try {
    const key = createPublicKey({
      key: Buffer.from(base64Spki, 'base64'),
      format: 'der',
      type: 'spki',
    });
    return key.asymmetricKeyType === 'ed25519' ? key : null;
  } catch {
    return null;
  }
}

export function signedMessage(timestamp: string, rawBody: Buffer): string {
  return `${timestamp}.${sha256Hex(rawBody)}`;
}

export function verifyDeviceSignature(
  publicKey: string,
  timestamp: string,
  rawBody: Buffer,
  signature: string,
): boolean {
  const key = parseDevicePublicKey(publicKey);
  if (!key) return false;
  try {
    return verify(
      null,
      Buffer.from(signedMessage(timestamp, rawBody)),
      key,
      Buffer.from(signature, 'base64'),
    );
  } catch {
    return false;
  }
}
