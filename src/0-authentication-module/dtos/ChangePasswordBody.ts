import { CodeType } from '@prisma/client';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ChangePasswordBody {
  @IsNotEmpty({ message: 'Email Is Required.' })
  @IsEmail({}, { message: 'Must Be A Valid Email.' })
  email: string;
}

export class VerificationCodeBodyToInsertIntoDb {
  user_email: string;
  verification_code: string;
  expiration_date: Date;
  code_type: CodeType;
}
