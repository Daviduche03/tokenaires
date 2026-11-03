import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class DevApproveDto {
  @IsString()
  @Length(9, 9)
  code!: string;

  @IsOptional()
  @Matches(/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/)
  handle?: string;
}
