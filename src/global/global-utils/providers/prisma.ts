import { Injectable } from '@nestjs/common';
import { JwtToken, PrismaClient, User, VerificationCode } from '@prisma/client';
import { VerificationCodeBodyToInsertIntoDb } from 'src/0-authentication-module/dtos/ChangePasswordBody';
import { RegistrationBody } from 'src/0-authentication-module/dtos/RegistrationBody';
import { SingletonPrismaProvider } from './singleton-prisma';

@Injectable()
export class PrismaProvider {
  private readonly prisma: PrismaClient;
  constructor() {
    this.prisma = SingletonPrismaProvider.prisma_instance;
  }
  private async deleteAllExpiredVerificationCodes(): Promise<void> {
    await this.prisma.verificationCode.deleteMany({
      where: { expiration_date: { lt: new Date() } },
    });
  }
  private async deleteAllExpiredJwt(): Promise<void> {
    await this.prisma.jwtToken.deleteMany({
      where: { expiration_time: { lt: new Date() } },
    });
  }
  public async deleteAllExpiredCodesAndTokens(): Promise<void> {
    await this.deleteAllExpiredVerificationCodes();
    await this.deleteAllExpiredJwt();
  }
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
  public async getJwtByToken(token: string): Promise<JwtToken> {
    return await this.prisma.jwtToken.findUnique({
      where: { token: token },
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
  public async updateUserWithId(id: number, updatedUser: User): Promise<void> {
    await this.prisma.user.update({
      where: { id: id },
      data: updatedUser,
    });
  }
  public async getUserWithId(id: number): Promise<User> {
    return await this.prisma.user.findUnique({
      where: { id: id },
    });
  }
  public async createNewUser(user: RegistrationBody): Promise<void> {
    await this.prisma.user.create({ data: user });
  }
  public async getLastVerificationCode(
    userEmail: string,
  ): Promise<VerificationCode> {
    return await this.prisma.verificationCode.findFirst({
      where: { user_email: userEmail, is_valid: true },
    });
  }
  public async createNewJwtToken(token: {
    token: string;
    expiration_time: Date;
  }): Promise<void> {
    await this.prisma.jwtToken.create({ data: token });
  }
  public async updateLastVerificationCodeValidity(
    id: number,
    verificationCodeEntryUpdated: VerificationCode,
  ): Promise<void> {
    await this.prisma.verificationCode.update({
      where: { id: id },
      data: verificationCodeEntryUpdated,
    });
  }
  public async findVerificationCodeById(id: number): Promise<VerificationCode> {
    return await this.prisma.verificationCode.findUnique({ where: { id } });
  }
  public async storeVerificationCode(
    dataToInsert: VerificationCodeBodyToInsertIntoDb,
  ): Promise<void> {
    const findLastVerificationCode = await this.getLastVerificationCode(
      dataToInsert.user_email,
    );
    if (findLastVerificationCode !== null) {
      findLastVerificationCode['is_valid'] = false;
      await this.updateLastVerificationCodeValidity(
        findLastVerificationCode.id,
        findLastVerificationCode,
      );
    }
    await this.prisma.verificationCode.create({
      data: dataToInsert,
    });
  }
  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
