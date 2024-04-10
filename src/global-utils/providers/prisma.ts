import { Injectable } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';

@Injectable()
export class PrismaProvider {
  private readonly prisma: PrismaClient = new PrismaClient();
  async getUserbyUsername(givenUsername: string): Promise<User> {
    return await this.prisma.user.findUnique({
      where: { username: givenUsername },
    });
  }
  async getUserByEmail(givenEmail: string): Promise<User> {
    return await this.prisma.user.findUnique({
      where: { email: givenEmail },
    });
  }
}
