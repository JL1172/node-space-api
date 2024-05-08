import { IsEnum, IsNotEmpty, IsNumberString } from 'class-validator';
import {
  CompletedEnum,
  IdEnum,
  SortByTodoEnum,
} from 'src/0-customer-module/dtos/GetCustomerTodoBodies';

//case of customer_id or cid being assigned to a number and pid is all so all projects of one customer
export class AllProjectsOfOneCustomer {
  @IsNumberString({}, { message: 'Limit Must Be A Numerical Value.' })
  @IsNotEmpty({ message: 'Required.' })
  limit: string;
  @IsNumberString({}, { message: 'Page Must Be A Numerical Value.' })
  @IsNotEmpty({ message: 'Required.' })
  page: string;
  @IsNotEmpty({ message: 'Required.' })
  @IsEnum(SortByTodoEnum, {
    message: 'Must Either Be "urgent" Or "not_urgent".',
  })
  sortBy: string;
  @IsEnum(CompletedEnum, { message: 'Must Be "all", "false", Or "true". ' })
  @IsNotEmpty({ message: 'Required.' })
  complete: string;
  @IsEnum(IdEnum, { message: 'Must Be All Or Number.' })
  @IsNotEmpty({ message: 'Required.' })
  pid: string;
  @IsNumberString({}, { message: 'Customer Id Must Be A Numerical Value.' })
  @IsNotEmpty({ message: 'Required.' })
  cid: string;
}
//all projects of every customer
export class AllProjectsOfEveryCustomer {
  @IsNumberString({}, { message: 'Limit Must Be A Numerical Value.' })
  @IsNotEmpty({ message: 'Required.' })
  limit: string;
  @IsNumberString({}, { message: 'Page Must Be A Numerical Value.' })
  @IsNotEmpty({ message: 'Required.' })
  page: string;
  @IsNotEmpty({ message: 'Required.' })
  @IsEnum(SortByTodoEnum, {
    message: 'Must Either Be "urgent" Or "not_urgent".',
  })
  sortBy: string;
  @IsEnum(CompletedEnum, { message: 'Must Be "all", "false", Or "true". ' })
  @IsNotEmpty({ message: 'Required.' })
  complete: string;
  @IsEnum(IdEnum, { message: 'Must Be All Or Number.' })
  @IsNotEmpty({ message: 'Required.' })
  pid: string;
  @IsEnum(IdEnum, { message: 'Must Be All Or Number.' })
  @IsNotEmpty({ message: 'Required.' })
  cid: string;
}
//one project for one customer
export class OneProjectForOneCustomer {
  @IsNumberString({}, { message: 'Limit Must Be A Numerical Value.' })
  @IsNotEmpty({ message: 'Required.' })
  limit: string;
  @IsNumberString({}, { message: 'Page Must Be A Numerical Value.' })
  @IsNotEmpty({ message: 'Required.' })
  page: string;
  @IsNotEmpty({ message: 'Required.' })
  @IsEnum(SortByTodoEnum, {
    message: 'Must Either Be "urgent" Or "not_urgent".',
  })
  sortBy: string;
  @IsEnum(CompletedEnum, { message: 'Must Be "all", "false", Or "true". ' })
  @IsNotEmpty({ message: 'Required.' })
  complete: string;
  @IsNumberString({}, { message: 'Project Id Must Be A Numerical Value.' })
  @IsNotEmpty({ message: 'Required.' })
  pid: string;
  @IsNumberString({}, { message: 'Customer Id Must Be A Numerical Value.' })
  @IsNotEmpty({ message: 'Required.' })
  cid: string;
}
