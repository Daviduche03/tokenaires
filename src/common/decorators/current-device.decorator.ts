import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AuthenticatedDevice,
  AuthenticatedRequest,
} from '../guards/authenticated-device';

export const CurrentDevice = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedDevice => {
    const device = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>().device;
    if (!device) throw new UnauthorizedException();
    return device;
  },
);
