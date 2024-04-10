import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import {
  RegisterRateLimit,
  SanitizeRegistrationBody,
  ValidateRegistrationBody,
  VerifyUserIsUnique,
} from './middleware/registration';
import { AuthenticationController } from './auth.controller';
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
      .apply(
        RegisterRateLimit,
        ValidateRegistrationBody,
        SanitizeRegistrationBody,
        VerifyUserIsUnique,
      )
      .forRoutes('/api/auth/registration');
  }
}
