import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthenticationModule } from './0-authentication-module/auth-module';
import { GlobalLogger } from './global/global-utils/middleware/logger';
import { ScheduleModule } from '@nestjs/schedule';
import { CronModule } from './global/cron/cron-module';

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
