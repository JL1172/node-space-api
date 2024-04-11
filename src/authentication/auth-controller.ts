import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { RegistrationBody } from './dtos/RegistrationBody';
import { PrismaProvider } from 'src/global-utils/providers/prisma';
import { User } from '@prisma/client';
import { BcryptProvider } from './providers/bcrypt';
import { JwtProvider } from './providers/jwt';
import { UserClass } from './providers/login';

@Controller('/api/auth')
export class AuthenticationController {
  constructor(
    private readonly prisma: PrismaProvider,
    private readonly bcrypt: BcryptProvider,
    private readonly jwt: JwtProvider,
    private readonly user: UserClass,
  ) {}
  @Post('/registration')
  public async register(@Body() body: RegistrationBody): Promise<string> {
    body.password = await this.bcrypt.hashPassword(body.password);
    await this.prisma.createNewUser(body);
    return 'New Account Successfully Created.';
  }
  @Post('/login')
  @HttpCode(200)
  public async login(): Promise<void> {
    //todo need to finish this functionality and debug
    // this.jwt.createJwtToken(this.user.getUser());
    // return this.jwt.getJwtToken();
  }
  @Get('/')
  public async getAll(): Promise<User[]> {
    return await this.prisma.getAllUsers();
  }
}
