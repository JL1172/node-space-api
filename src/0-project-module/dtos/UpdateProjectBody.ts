import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdatedProjectBody {
  @IsNotEmpty({ message: 'Required.' })
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'Must Be A Number.' },
  )
  id: number;
  @IsNotEmpty({ message: 'Required.' })
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'Must Be A Number.' },
  )
  customer_id: number;
  @IsNotEmpty({ message: 'Required.' })
  @IsString({ message: 'Must Be A String.' })
  project_title: string;
  @IsNotEmpty({ message: 'Required.' })
  @IsString({ message: 'Must Be A String.' })
  project_description: string;
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'Must Be A Number.' },
  )
  @IsPositive({ message: 'Must Be Greater Than 0.' })
  @IsNotEmpty({ message: 'Required.' })
  budget: number;
  @IsDateString({ strict: true }, { message: 'Must Be A Date.' })
  @IsNotEmpty({ message: 'Required.' })
  estimated_end_date: string;
  @IsPositive({ message: 'Must Be Greater Than 0.' })
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'Must Be A Number.' },
  )
  @IsNotEmpty({ message: 'Required.' })
  estimated_revenue: number;
}

export class FinalUpdatedProjectBody {
  customer_id: number;
  project_title: string;
  project_description: string;
  budget: number;
  estimated_end_date: string | Date;
  estimated_revenue: number;
  user_id: number;
  id: number;
}
