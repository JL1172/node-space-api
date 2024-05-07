import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CustomerTodo {
  @IsNumber({}, { message: 'Must Be A Number.' })
  @IsNotEmpty({ message: 'Customer Is Required.' })
  customer_id: number;
  @IsNotEmpty({ message: 'User Id Is Required.' })
  @IsNumber({}, { message: 'Must Be A Number.' })
  user_id: number;
  @IsString({ message: 'Must Be A String.' })
  @IsNotEmpty({ message: 'Description Is Required.' })
  todo_description: string;
  @IsNotEmpty({ message: 'Title Is Required.' })
  @IsString({ message: 'Must Be A String.' })
  todo_title: string;
  @IsDateString({ strict: true }, { message: 'Must Be A Valid Date.' })
  @IsNotEmpty({ message: 'Deadline Date Required.' })
  deadline_date: Date;
}
