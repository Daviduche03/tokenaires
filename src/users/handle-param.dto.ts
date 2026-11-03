import { Matches } from 'class-validator';

export class HandleParamDto {
  @Matches(/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/)
  handle!: string;
}
