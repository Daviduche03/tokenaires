import { Controller, Get, Header, Param, UseGuards } from '@nestjs/common';
import { MeSummary, ProfileResponse } from '@tokenaires/contracts';
import { CurrentDevice } from '../common/decorators/current-device.decorator';
import type { AuthenticatedDevice } from '../common/guards/authenticated-device';
import { TokenGuard } from '../common/guards/token.guard';
import { BOARD_CACHE_SECONDS } from '../config/constants';
import { HandleParamDto } from './handle-param.dto';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('users/:handle')
  @Header('Cache-Control', `public, max-age=${BOARD_CACHE_SECONDS}`)
  profile(@Param() params: HandleParamDto): Promise<ProfileResponse> {
    return this.users.profile(params.handle);
  }

  @Get('me')
  @Header('Cache-Control', 'no-store')
  @UseGuards(TokenGuard)
  me(@CurrentDevice() device: AuthenticatedDevice): Promise<MeSummary> {
    return this.users.me(device.userId);
  }
}
