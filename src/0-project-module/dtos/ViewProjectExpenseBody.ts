import { IsEnum, IsNotEmpty, IsNumberString } from 'class-validator';
import { OrderByTodoEnum } from 'src/0-customer-module/dtos/GetCustomerTodoBodies';

export enum SortByExpense {
  CREATED_AT = 'created_at',
  MONETARY_AMOUNT = 'monetary_amount',
}
export enum All {
  All = 'all',
}
export class ViewProjectExpenseBody {
  @IsNumberString({}, { message: 'Must Be Numerical Value.' })
  @IsNotEmpty({ message: 'Required.' })
  limit: string;
  @IsNotEmpty({ message: 'Required.' })
  @IsNumberString({}, { message: 'Must Be Numerical Value.' })
  page: string;
  @IsEnum(SortByExpense, {
    message: 'Must Be "created_at" Or "monetary_amount".',
  })
  @IsNotEmpty({ message: 'Required.' })
  sortBy: string;
  @IsEnum(OrderByTodoEnum, { message: 'Must Be "asc" Or "desc".' })
  @IsNotEmpty({ message: 'Required.' })
  orderBy: string;
  @IsNotEmpty({ message: 'Required.' })
  @IsNumberString({}, { message: 'Must Be Numerical Value.' })
  pid: string;
  @IsNotEmpty({ message: 'Required.' })
  @IsNumberString({}, { message: 'Must Be Numerical Value.' })
  eid: string;
}
export class ViewProjectExpenseBodyAll {
  @IsNumberString({}, { message: 'Must Be Numerical Value.' })
  @IsNotEmpty({ message: 'Required.' })
  limit: string;
  @IsNotEmpty({ message: 'Required.' })
  @IsNumberString({}, { message: 'Must Be Numerical Value.' })
  page: string;
  @IsEnum(SortByExpense, {
    message: 'Must Be "created_at" Or "monetary_amount".',
  })
  @IsNotEmpty({ message: 'Required.' })
  sortBy: string;
  @IsEnum(OrderByTodoEnum, { message: 'Must Be "asc" Or "desc".' })
  @IsNotEmpty({ message: 'Required.' })
  orderBy: string;
  @IsNotEmpty({ message: 'Required.' })
  @IsNumberString({}, { message: 'Must Be Numerical Value.' })
  pid: string;
  @IsEnum(All, { message: 'Must Be All.' })
  @IsNotEmpty({ message: 'Required.' })
  eid: string;
}
