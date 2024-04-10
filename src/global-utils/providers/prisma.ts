import { Injectable } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import { RegistrationBody } from 'src/auth/dtos/RegistrationBody';

@Injectable()
export class PrismaProvider {
  private readonly prisma: PrismaClient = new PrismaClient();
  public async getUserbyUsername(givenUsername: string): Promise<User> {
    return await this.prisma.user.findUnique({
      where: { username: givenUsername },
    });
  }
  public async getUserByEmail(givenEmail: string): Promise<User> {
    return await this.prisma.user.findUnique({
      where: { email: givenEmail },
    });
  }
  public async createNewUser(user: RegistrationBody): Promise<void> {
    await this.prisma.user.create({ data: user });
  }
}
