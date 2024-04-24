import { Module } from '@nestjs/common';
import { ExpiredTokenAndCodeCleanup } from './cron-jobs';
import { CronPrismaProvider } from './providers/prisma';

@Module({
  providers: [ExpiredTokenAndCodeCleanup, CronPrismaProvider],
})
export class CronModule {}
