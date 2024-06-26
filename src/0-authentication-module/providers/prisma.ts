import { Injectable } from '@nestjs/common';
import {
  CodeType,
  JwtToken,
  PrismaClient,
  User,
  VerificationCode,
} from '@prisma/client';
import { RegistrationBody } from '../dtos/RegistrationBody';
import { VerificationCodeBodyToInsertIntoDb } from '../dtos/ChangePasswordBody';
import { SingletonPrismaProvider } from '../../global/global-utils/providers/singleton-prisma';

@Injectable()
export class AuthenticationPrismaProvider {
  private readonly prisma: PrismaClient;
  constructor() {
    this.prisma = SingletonPrismaProvider.prisma_instance;
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
    code_type: CodeType,
  ): Promise<VerificationCode> {
    const code = await this.prisma.verificationCode.findFirst({
      where: { user_email: userEmail, is_valid: true, code_type: code_type },
    });
    return code;
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
      dataToInsert.code_type,
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
}
