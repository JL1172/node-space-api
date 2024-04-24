import { Module } from '@nestjs/common';
import { ExpiredTokenAndCodeCleanup } from './cron-jobs';
import { PrismaProvider } from 'src/global/global-utils/providers/prisma';

@Module({
  providers: [ExpiredTokenAndCodeCleanup, PrismaProvider],
})
export class CronModule {}
