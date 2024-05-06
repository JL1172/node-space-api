import { IsEnum, IsNotEmpty, IsNumberString, IsString } from 'class-validator';

export enum SortDir {
  DESC = 'desc',
  ASC = 'asc',
}
enum SortBy {
  CREATED_AT = 'created_at',
}

export class QueryBody {
  @IsNotEmpty({ message: 'Limit Query Required.' })
  @IsNumberString({}, { message: 'Must Be A Numeric String.' })
  limit: string;
  @IsNotEmpty({ message: 'Page Query Required.' })
  @IsNumberString({}, { message: 'Must Be A Numeric String.' })
  page: string;
  @IsNotEmpty({ message: 'SortDir Query Required.' })
  @IsString({ message: 'Must Be A String.' })
  @IsEnum(SortDir, { message: 'Must Either Be DESC Or ASC' })
  sortDir: SortDir;
  @IsNotEmpty({ message: 'SortBy Query Required.' })
  @IsString({ message: 'Must Be A String.' })
  @IsEnum(SortBy, { message: 'Must Be Created_AT.' })
  sortBy: string;
}

export class ParamBody {
  @IsNotEmpty({ message: 'Id Required.' })
  @IsNumberString({}, { message: 'Must Be A Valid Number String.' })
  id: string;
}
