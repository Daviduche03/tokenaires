import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsageController } from './usage.controller';
import { UsageRepository } from './usage.repository';
import { UsageService } from './usage.service';

@Module({
  imports: [AuthModule],
  controllers: [UsageController],
  providers: [UsageService, UsageRepository],
  exports: [UsageRepository],
})
export class UsageModule {}
