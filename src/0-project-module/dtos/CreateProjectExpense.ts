import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateProjectExpenseBody {
  @IsNumber({}, { message: 'Must Be A Number.' })
  @IsNotEmpty({ message: 'Required.' })
  project_id: number;
  @IsNumber({}, { message: 'Must Be A Number.' })
  @IsNotEmpty({ message: 'Required.' })
  monetary_amount: number;
  @IsNotEmpty({ message: 'Required.' })
  @IsString({ message: 'Must Be A String.' })
  expense_description: string;
}
