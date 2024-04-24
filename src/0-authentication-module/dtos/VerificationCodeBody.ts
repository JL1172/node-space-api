import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class VerificationCodeBody {
  @IsNotEmpty({ message: 'Email Required.' })
  @IsEmail({}, { message: 'Must Be A Valid Email.' })
  email: string;
  @IsNotEmpty({ message: 'Verification Code Required.' })
  @MinLength(6, { message: 'Full Verification Code Required.' })
  verification_code: string;
}
