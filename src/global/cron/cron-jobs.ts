import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CronPrismaProvider } from './providers/prisma';

@Injectable()
export class ExpiredTokenAndCodeCleanup {
  private readonly logger: Logger = new Logger(ExpiredTokenAndCodeCleanup.name);
  constructor(private readonly prisma: CronPrismaProvider) {}
  @Cron(CronExpression.EVERY_HOUR)
  public async queryJwtTable(): Promise<void> {
    try {
      this.logger.log(
        'Executing Cron Job [Token And Verification Code Cleanup]',
      );
      await this.prisma.deleteAllExpiredCodesAndTokens();
      this.logger.log('Cron Job Successfully Executed.');
    } catch (err) {
      this.logger.error('Error Attempting to remove expired tokens: ', err);
    }
  }
}
