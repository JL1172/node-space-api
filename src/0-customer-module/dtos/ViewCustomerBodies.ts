import { IsNumberString } from 'class-validator';

export class QueryParamsBody2 {
  @IsNumberString({}, { message: 'Must Be A Valid Number.' })
  id?: string;
}
