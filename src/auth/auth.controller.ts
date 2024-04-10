import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { BcryptProvider } from './providers/bcrypt';
import { RegistrationBody } from './dtos/RegistrationBody';
import { PrismaProvider } from 'src/global-utils/providers/prisma';

@Controller('/api/auth')
export class AuthenticationController {
  constructor(
    private readonly bcrypt: BcryptProvider,
    private readonly prisma: PrismaProvider,
  ) {}
  @Post('/registration')
  public async registerUser(@Body() body: RegistrationBody): Promise<void> {
    try {
      const hashedPassword = this.bcrypt.hashPassword(body.password);
      if (!hashedPassword)
        throw new HttpException(
          'Internal Server Error.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      body.password = hashedPassword;
      await this.prisma.createNewUser(body);
    } catch (err) {
      throw new HttpException(
        'An Unexpected Problem Occurred, Try Again.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
