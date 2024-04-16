import { IsNotEmpty, IsStrongPassword } from 'class-validator';

export class ResetPasswordBody {
  @IsStrongPassword(
    { minLength: 8 },
    {
      message:
        'Must Be A Strong Password, Fullfilling Each Of The Following Requirements: Min length of 8, 1 special char, 1 lowercase case, 1 uppercase, 1 number.',
    },
  )
  password: string;
  @IsStrongPassword(
    { minLength: 8 },
    {
      message:
        'Must Be A Strong Password, Fullfilling Each Of The Following Requirements: Min length of 8, 1 special char, 1 lowercase case, 1 uppercase, 1 number.',
    },
  )
  confirmedPassword: string;
}

export class ResetPasswordHeaders {
  @IsNotEmpty({ message: 'Token Required.' })
  token: string;
}
