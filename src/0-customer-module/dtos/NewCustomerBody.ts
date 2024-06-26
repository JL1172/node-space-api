import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class NewCustomerBody {
  @IsNotEmpty({ message: 'Phone Number Is Required.' })
  @IsString({ message: 'Phone Number Must Be A String.' })
  @Matches(/^[0-9]*$/, { message: 'Phone Number Must Only Contain Numbers.' })
  @MinLength(10, { message: 'Invalid Phone Number.' })
  phoneNumber: string;
  @IsNotEmpty({ message: 'Address Is Required.' })
  @IsString({ message: 'Address Must Be A string.' })
  @MinLength(5, { message: 'Address Must Be Longer Than 5 Characters.' })
  @Matches(/^[.,a-zA-Z0-9#\- \s]+$/, { message: 'Invalid Address.' })
  address: string;
  @IsNotEmpty({ message: 'Full Name Is Required.' })
  @IsString({ message: 'Full Name Must Be A String.' })
  @Matches(/^[A-Za-z ]+$/, { message: 'Full Name Must Only Contain Letters.' })
  full_name: string;
  @IsNotEmpty({ message: 'Email Is Required.' })
  @IsEmail({}, { message: 'Invalid Email.' })
  email: string;
}

export class NewCustomerBodyToInsertIntoDb {
  phoneNumber: string;
  address: string;
  full_name: string;
  email: string;
  user_id: number;
}
