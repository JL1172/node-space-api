import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import {
  RateLimiter,
  SanitizeBody,
  ValidateBody,
  VerifyUserIsUnique,
} from './middleware /registration';
import { AuthenticationController } from './auth-controller';
import { PrismaProvider } from 'src/global-utils/providers/prisma';
import { BcryptProvider } from './providers/bcrypt';

@Module({
  imports: [],
  controllers: [AuthenticationController],
  providers: [PrismaProvider, BcryptProvider],
})
export class AuthenticationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RateLimiter, ValidateBody, SanitizeBody, VerifyUserIsUnique)
      .forRoutes('/api/auth/registration');
  }
}
