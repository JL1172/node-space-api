import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsString,
  IsStrongPassword,
  Matches,
} from 'class-validator';

export class RegisterBodyDto {
  @IsEmail({}, { message: 'Must Be A Valid Email.' })
  @IsNotEmpty({ message: 'Email Is Required.' })
  email: string;
  @IsNotEmpty({ message: 'Username Is Required.' })
  @IsString({ message: 'Username Must Be String.' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d).+/, {
    message: 'Username Must Be Alphanumeric.',
  })
  username: string;
  @IsString({ message: 'First Name Must Be A String.' })
  @Matches(/^[A-Za-z]*$/, {
    message: 'First Name Must Only Consist Of Letters.',
  })
  @IsNotEmpty({ message: 'First Name Is Required.' })
  first_name: string;
  @IsString({ message: 'Last Name Must Be A String.' })
  @Matches(/^[A-Za-z]*$/, {
    message: 'Last Name Must Only Consist Of Letters.',
  })
  @IsNotEmpty({ message: 'Last Name Is Required.' })
  last_name: string;
  @IsNotEmpty({ message: 'Password Is Required.' })
  @IsString({ message: 'Password Must Be A String.' })
  @IsStrongPassword(
    { minLength: 8 },
    {
      message:
        'Must Be A Strong Password, Which Contains The Following: A min length of 8 characters, and at least one of each: a special character, lowercase letter, uppercase letter, and number ',
    },
  )
  password: string;
  @IsNotEmpty({ message: 'Age Is Required.' })
  @IsNumberString({}, { message: 'Age Must Be A Number.' })
  age: number;
}
