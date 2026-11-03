import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthRepository } from '../../auth/auth.repository';
import { sha256Hex } from '../utils/crypto';
import { AuthenticatedRequest } from './authenticated-device';

const BEARER = /^Bearer\s+(\S+)$/i;

@Injectable()
export class TokenGuard implements CanActivate {
  constructor(private readonly auth: AuthRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const match = BEARER.exec(request.headers.authorization ?? '');
    if (!match)
      throw new UnauthorizedException('Sign in with the Tokenaires CLI first');
    const device = await this.auth.findActiveDeviceByTokenHash(
      sha256Hex(match[1]),
    );
    if (!device) throw new UnauthorizedException('This device is signed out');
    request.device = {
      deviceId: device.id,
      userId: device.userId,
      publicKey: device.publicKey,
    };
    return true;
  }
}
