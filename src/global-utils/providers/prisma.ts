import { Injectable } from '@nestjs/common';
import { PrismaClient, User, VerificationCode } from '@prisma/client';
import { VerificationCodeBodyToInsertIntoDb } from 'src/authentication/dtos/ChangePasswordBody';
import { RegistrationBody } from 'src/authentication/dtos/RegistrationBody';

@Injectable()
export class PrismaProvider {
  private readonly prisma = new PrismaClient();
  //this group of methods is for determining the uniqueness of a user
  public async getUserByUsername(receivedUsername: string): Promise<User> {
    return await this.prisma.user.findUnique({
      where: { username: receivedUsername },
    });
  }
  public async getUserByEmail(receivedEmail: string): Promise<User> {
    return await this.prisma.user.findUnique({
      where: { email: receivedEmail },
    });
  }
  public async isUserUnique(
    receivedEmail: string,
    receivedUsername: string,
  ): Promise<boolean[]> {
    const userByEmail: User = await this.getUserByEmail(receivedEmail);
    const userByUsername: User = await this.getUserByUsername(receivedUsername);
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
  public async storeVerificationCode(
    dataToInsert: VerificationCodeBodyToInsertIntoDb,
  ): Promise<void> {
    await this.prisma.verificationCode.create({ data: dataToInsert });
  }
  public async getVerificationCode(
    userEmail: string,
  ): Promise<VerificationCode> {
    return await this.prisma.verificationCode.findUnique({
      where: { user_email: userEmail },
    });
  }
}
