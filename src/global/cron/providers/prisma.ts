import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { SingletonPrismaProvider } from 'src/global/global-utils/providers/singleton-prisma';

@Injectable()
export class CronPrismaProvider {
  private readonly prisma: PrismaClient;
  constructor() {
    this.prisma = SingletonPrismaProvider.prisma_instance;
  }
  //cron jobs
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
}
