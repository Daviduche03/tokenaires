import { generateKeyPairSync, sign } from 'node:crypto';
import {
  parseDevicePublicKey,
  sha256Hex,
  verifyDeviceSignature,
} from './crypto';

describe('device signatures', () => {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const spki = publicKey
    .export({ type: 'spki', format: 'der' })
    .toString('base64');
  const body = Buffer.from('{"records":[]}');
  const timestamp = '1762171200000';
  const signature = sign(
    null,
    Buffer.from(`${timestamp}.${sha256Hex(body)}`),
    privateKey,
  ).toString('base64');

  it('verifies a signature over timestamp and body hash', () => {
    expect(verifyDeviceSignature(spki, timestamp, body, signature)).toBe(true);
  });

  it('rejects a changed body or timestamp', () => {
    expect(
      verifyDeviceSignature(
        spki,
        timestamp,
        Buffer.from('{"records":[1]}'),
        signature,
      ),
    ).toBe(false);
    expect(verifyDeviceSignature(spki, '1762171200001', body, signature)).toBe(
      false,
    );
  });

  it('only accepts Ed25519 keys', () => {
    const rsa = generateKeyPairSync('rsa', { modulusLength: 1024 }).publicKey;
    expect(
      parseDevicePublicKey(
        rsa.export({ type: 'spki', format: 'der' }).toString('base64'),
      ),
    ).toBeNull();
    expect(parseDevicePublicKey('bm90IGEga2V5')).toBeNull();
  });
});
