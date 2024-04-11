import { Body, Controller, Get, Post } from '@nestjs/common';
import { RegistrationBody } from './dtos/RegistrationBody';
import { PrismaProvider } from 'src/global-utils/providers/prisma';
import { User } from '@prisma/client';
import { BcryptProvider } from './providers/bcrypt';

@Controller('/api/auth')
export class AuthenticationController {
  constructor(
    private readonly prisma: PrismaProvider,
    private readonly bcrypt: BcryptProvider,
  ) {}
  @Post('/registration')
  public async register(@Body() body: RegistrationBody): Promise<string> {
    body.password = await this.bcrypt.hashPassword(body.password);
    await this.prisma.createNewUser(body);
    return 'New Account Successfully Created.';
  }
  @Post('/login')
  public async login(): Promise<string> {
    return 'successfully logged in';
  }
  @Get('/')
  public async getAll(): Promise<User[]> {
    return await this.prisma.getAllUsers();
  }
}
