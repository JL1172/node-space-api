import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { RegistrationBody } from './dtos/RegistrationBody';
import { PrismaProvider } from 'src/global-utils/providers/prisma';
import { User } from '@prisma/client';
import { BcryptProvider } from './providers/bcrypt';
import { JwtProvider } from './providers/jwt';
import { UserClass } from './providers/login';
import { Mailer } from './providers/email';
import { AuthenticationErrorHandler } from './providers/error';

@Controller('/api/auth')
export class AuthenticationController {
  constructor(
    private readonly prisma: PrismaProvider,
    private readonly bcrypt: BcryptProvider,
    private readonly jwt: JwtProvider,
    private readonly user: UserClass,
    private readonly errorHandler: AuthenticationErrorHandler,
    private readonly mailer: Mailer,
  ) {}
  @Post('/registration')
  public async register(@Body() body: RegistrationBody): Promise<string> {
    body.password = await this.bcrypt.hashPassword(body.password);
    await this.prisma.createNewUser(body);
    return 'New Account Successfully Created.';
  }
  @Post('/login')
  @HttpCode(200)
  public login(): { token: string } {
    this.jwt.createJwtToken(this.user.getUser());
    return { token: this.jwt.getJwtToken() };
  }
  @Post('/change-password')
  public changePassword(): string {
    try {
      return 'Check Your Inbox For Your Verification Code.';
    } catch (err) {
      this.errorHandler.reportHttpError(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  @Post('/verify-code')
  //TODO this is the next step: see commit [b9918d3] for instructions
  public verifyCode(): string {
    try {
      return 'hello wrold form verify code endpoint';
    } catch (err) {
      this.errorHandler.reportHttpError(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  @Get('/')
  public async getAll(): Promise<User[]> {
    return await this.prisma.getAllUsers();
  }
}
