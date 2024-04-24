import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthenticationModule } from './authentication/auth-module';
import { GlobalLogger } from './global-utils/middleware/logger';
import { ScheduleModule } from '@nestjs/schedule';
import { CronModule } from './cron/cron-module';

@Module({
  imports: [AuthenticationModule, ScheduleModule.forRoot(), CronModule],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(GlobalLogger).forRoutes('*');
  }
}
