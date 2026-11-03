import {
  AGENT_SOURCES,
  type AgentSource,
  INGEST_LIMITS,
  type IngestBatch,
  type UsageRecord,
} from '@tokenaires/contracts';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

function TokenCount(): PropertyDecorator {
  return (target, key) => {
    IsInt()(target, key);
    Min(0)(target, key);
    Max(INGEST_LIMITS.maxTokensPerField)(target, key);
  };
}

export class UsageRecordDto implements UsageRecord {
  @IsIn(AGENT_SOURCES)
  source!: AgentSource;

  @IsString()
  @Length(8, INGEST_LIMITS.maxRecordIdLength)
  recordId!: string;

  @IsString()
  @Length(1, INGEST_LIMITS.maxModelLength)
  model!: string;

  @IsISO8601({ strict: true })
  occurredAt!: string;

  @TokenCount()
  inputTokens!: number;

  @TokenCount()
  outputTokens!: number;

  @TokenCount()
  cacheReadTokens!: number;

  @TokenCount()
  cacheWriteTokens!: number;

  @TokenCount()
  reasoningTokens!: number;
}

export class IngestBatchDto implements IngestBatch {
  @IsString()
  @Length(1, 32)
  cliVersion!: string;

  @IsArray()
  @ArrayMaxSize(INGEST_LIMITS.maxRecordsPerBatch)
  @ValidateNested({ each: true })
  @Type(() => UsageRecordDto)
  records!: UsageRecordDto[];
}
