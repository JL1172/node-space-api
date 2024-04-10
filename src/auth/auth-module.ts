import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import {
  RegisterRateLimit,
  SanitizeRegistrationBody,
  ValidateRegistrationBody,
  VerifyUserIsUnique,
} from './middleware/registration';
import { AuthenticationController } from './auth.controller';
import { PrismaProvider } from 'src/providers/prisma';

@Module({
  imports: [],
  controllers: [AuthenticationController],
  providers: [PrismaProvider],
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
