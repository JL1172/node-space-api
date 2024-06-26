import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginBody {
  @IsString({ message: 'Username Must Be String.' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d).+/, { message: 'Invalid Username' })
  username: string;
  @IsNotEmpty({ message: 'Password Is Required.' })
  password: string;
}
