import { Request } from 'express';

export interface AuthenticatedDevice {
  deviceId: string;
  userId: string;
  publicKey: string;
}

export interface AuthenticatedRequest extends Request {
  device?: AuthenticatedDevice;
  rawBody?: Buffer;
}
