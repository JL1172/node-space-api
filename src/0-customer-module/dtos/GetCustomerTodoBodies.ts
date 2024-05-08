import { IsEnum, IsNotEmpty, IsNumberString } from 'class-validator';

export enum SortByTodoEnum {
  URGENT = 'urgent',
  NOT_URGENT = 'not_urgent',
}
export enum OrderByTodoEnum {
  ASC = 'asc',
  DESC = 'desc',
}

export enum IdEnum {
  ALL = 'all',
}

export enum CompletedEnum {
  ALL = 'all',
  TRUE = 'true',
  FALSE = 'false',
}

export class QueryParamsTodoEndpointBody {
  @IsNumberString({}, { message: 'Must Be A Valid Number.' })
  @IsNotEmpty({ message: 'Limit Is Required.' })
  limit: string;
  @IsEnum(SortByTodoEnum, { message: 'Must Be Either Urgent Or Not_Urgent' })
  @IsNotEmpty({ message: 'Sort By Value Required.' })
  sortBy: string;
  @IsNotEmpty({ message: 'Page Value Required.' })
  @IsNumberString({}, { message: 'Page Must Be Numeric Value.' })
  page: string;
  @IsNotEmpty({ message: 'Id Required.' })
  @IsNumberString({}, { message: 'Id Must Be Numeric Value.' })
  id: string;
  @IsNotEmpty({ message: 'Customer Id Is Required.' })
  @IsNumberString({}, { message: 'Customer Id Must Be A Numeric Value.' })
  cid: string;
  @IsEnum(CompletedEnum, {
    message: 'Completed Field Must Either Be "true", "false", Or "all".',
  })
  @IsNotEmpty({ message: 'Completed Is Required.' })
  completed: string;
}

export class QueryParamsIdAllTodoEndpointBody {
  @IsNumberString({}, { message: 'Must Be A Valid Number.' })
  @IsNotEmpty({ message: 'Limit Is Required.' })
  limit: string;
  @IsEnum(SortByTodoEnum, { message: 'Must Be Either Urgent Or Not_Urgent' })
  @IsNotEmpty({ message: 'Sort By Value Required.' })
  sortBy: string;
  @IsNotEmpty({ message: 'Page Value Required.' })
  @IsNumberString({}, { message: 'Page Must Be Numeric Value.' })
  page: string;
  @IsNotEmpty({ message: 'Id Required.' })
  @IsEnum(IdEnum, { message: 'Must Be Either A Numeric Value Or All.' })
  id: string;
  @IsNotEmpty({ message: 'Customer Id Is Required.' })
  @IsNumberString({}, { message: 'Customer Id Must Be Numeric Value.' })
  cid: string;
  @IsEnum(CompletedEnum, {
    message: 'Completed Field Must Either Be "true", "false", Or "all".',
  })
  @IsNotEmpty({ message: 'Completed Is Required.' })
  completed: string;
}
