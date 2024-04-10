import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthenticationModule } from './auth/auth-module';
import { PrismaProvider } from './global-utils/providers/prisma';
import { EventLogger } from './global-utils/middleware/logger';

@Module({
  imports: [AuthenticationModule],
  controllers: [],
  providers: [PrismaProvider],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(EventLogger).forRoutes('*');
  }
}
