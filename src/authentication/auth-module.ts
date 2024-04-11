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
import {
  RateLimter,
  ValidateLoginBody,
  SanitizeLoginBody,
  ValidateUserExists,
} from './middleware /login';
import { UserClass } from './providers/login';

@Module({
  imports: [],
  controllers: [AuthenticationController],
  providers: [PrismaProvider, BcryptProvider, UserClass],
})
export class AuthenticationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RateLimiter, ValidateBody, SanitizeBody, VerifyUserIsUnique)
      .forRoutes('/api/auth/registration');
    consumer
      .apply(
        RateLimter,
        ValidateLoginBody,
        SanitizeLoginBody,
        ValidateUserExists,
      )
      .forRoutes('/api/auth/login');
  }
}
