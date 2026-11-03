import { DevicePollRequest } from '@tokenaires/contracts';
import { IsBase64, IsString, Length } from 'class-validator';

export class DevicePollDto implements DevicePollRequest {
  @IsString()
  @Length(1, 64)
  sessionId!: string;

  @IsBase64()
  @Length(40, 200)
  publicKey!: string;

  @IsString()
  @Length(1, 80)
  deviceName!: string;

  @IsString()
  @Length(1, 32)
  platform!: string;
}
