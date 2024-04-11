import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsString,
  IsStrongPassword,
  Matches,
} from 'class-validator';

export class RegistrationBody {
  @IsEmail({}, { message: 'Valid Email Required.' })
  email: string;
  @IsString({ message: 'First Name Must Be A String.' })
  @Matches(/^[A-Za-z]*$/, { message: 'Must Only Consist Of Letters.' })
  @IsNotEmpty({ message: 'First Name Is Required.' })
  first_name: string;
  @IsString({ message: 'Last Name Must Be A String.' })
  @Matches(/^[A-Za-z]*$/, { message: 'Must Only Consist Of Letters.' })
  @IsNotEmpty({ message: 'Last Name Required.' })
  last_name: string;
  @IsNotEmpty({ message: 'Age Required.' })
  @IsNumberString({}, { message: 'Age Must Be A Number.' })
  age: number;
  @IsString({ message: 'Username Must Be String.' })
  @IsNotEmpty({ message: 'Username Is Required.' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d).+/, {
    message: 'Username Must Consist Of Numbers And Letters.',
  })
  username: string;
  @IsStrongPassword(
    { minLength: 8 },
    {
      message:
        'Must Be A Strong Password, Fullfilling Each Of The Following Requirements: Min length of 8, 1 special char, 1 lowercase case, 1 uppercase, 1 number.',
    },
  )
  password: string;
}
