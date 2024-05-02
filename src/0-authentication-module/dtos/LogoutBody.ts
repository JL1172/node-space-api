import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutBody {
  @IsNotEmpty({ message: 'Token Required For Logging Out.' })
  @IsString({ message: 'Must Be A String.' })
  token: string;
}
