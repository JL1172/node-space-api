import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Matches,
} from 'class-validator';

export class LoginBody {
  @IsString({ message: 'Username Must Be String.' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d).+/, { message: 'Invalid Username' })
  username: string;
  @IsStrongPassword({ minLength: 8 }, { message: 'Improper Password.' })
  @IsNotEmpty({ message: 'Password Is Required.' })
  password: string;
}
