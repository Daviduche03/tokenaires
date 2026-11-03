import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  SIGNATURE_HEADERS,
  SIGNATURE_MAX_SKEW_MS,
} from '@tokenaires/contracts';
import { AuthRepository } from '../../auth/auth.repository';
import { verifyDeviceSignature } from '../utils/crypto';
import { AuthenticatedRequest } from './authenticated-device';

function header(request: AuthenticatedRequest, name: string): string {
  const value = request.headers[name];
  return typeof value === 'string' ? value : '';
}

@Injectable()
export class SignatureGuard implements CanActivate {
  constructor(private readonly auth: AuthRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const device = request.device;
    const deviceId = header(request, SIGNATURE_HEADERS.device);
    const timestamp = header(request, SIGNATURE_HEADERS.timestamp);
    const signature = header(request, SIGNATURE_HEADERS.signature);
    if (
      !device ||
      !request.rawBody ||
      deviceId !== device.deviceId ||
      !signature
    ) {
      throw new UnauthorizedException('Upload is not signed by this device');
    }
    const sentAt = Number(timestamp);
    if (
      !Number.isFinite(sentAt) ||
      Math.abs(Date.now() - sentAt) > SIGNATURE_MAX_SKEW_MS
    ) {
      throw new UnauthorizedException(
        'Upload signature has expired. Check your clock',
      );
    }
    if (
      !verifyDeviceSignature(
        device.publicKey,
        timestamp,
        request.rawBody,
        signature,
      )
    ) {
      throw new UnauthorizedException('Upload signature does not match');
    }
    const fresh = await this.auth.recordSignature(signature, deviceId);
    if (!fresh) throw new UnauthorizedException('This upload was already sent');
    return true;
  }
}
