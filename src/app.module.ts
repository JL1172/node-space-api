import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthenticationModule } from './authentication/auth-module';
import { GlobalLogger } from './global-utils/middleware/logger';

@Module({
  imports: [AuthenticationModule],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(GlobalLogger).forRoutes('*');
  }
}
