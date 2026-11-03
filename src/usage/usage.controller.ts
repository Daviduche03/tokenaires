import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IngestResult } from '@tokenaires/contracts';
import { CurrentDevice } from '../common/decorators/current-device.decorator';
import type { AuthenticatedDevice } from '../common/guards/authenticated-device';
import { SignatureGuard } from '../common/guards/signature.guard';
import { TokenGuard } from '../common/guards/token.guard';
import { THROTTLE } from '../config/constants';
import { IngestBatchDto } from './dto/ingest-batch.dto';
import { UsageService } from './usage.service';

@Controller('usage')
export class UsageController {
  constructor(private readonly usage: UsageService) {}

  @Post('batches')
  @HttpCode(200)
  @Throttle({ default: THROTTLE.ingest })
  @UseGuards(TokenGuard, SignatureGuard)
  ingest(
    @CurrentDevice() device: AuthenticatedDevice,
    @Body() batch: IngestBatchDto,
  ): Promise<IngestResult> {
    return this.usage.ingest(device, batch);
  }
}
