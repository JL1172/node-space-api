import { Injectable } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import { RegistrationBody } from 'src/authentication/dtos/RegistrationBody';

@Injectable()
export class PrismaProvider {
  private readonly prisma = new PrismaClient();
  //this group of methods is for determining the uniqueness of a user
  private async getUserByUsername(receivedUsername: string): Promise<User> {
    return await this.prisma.user.findUnique({
      where: { username: receivedUsername },
    });
  }
  private async getUserByEmail(receivedEmail: string): Promise<User> {
    return await this.prisma.user.findUnique({
      where: { email: receivedEmail },
    });
  }
  public async isUserUnique(
    receivedEmail: string,
    receivedUsername: string,
  ): Promise<boolean[]> {
    const userByUsername: User = await this.getUserByUsername(receivedUsername);
    const userByEmail: User = await this.getUserByEmail(receivedEmail);
    const resultArr: boolean[] = [true, true];
    if (userByEmail !== null) resultArr[0] = false;
    if (userByUsername !== null) resultArr[1] = false;
    return resultArr;
  }
  public async getAllUsers(): Promise<User[]> {
    return await this.prisma.user.findMany();
  }
  public async createNewUser(user: RegistrationBody): Promise<void> {
    await this.prisma.user.create({ data: user });
  }
}
