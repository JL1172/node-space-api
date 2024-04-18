import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import {
  RateLimiter,
  SanitizeBody,
  ValidateBody,
  VerifyUserIsUnique,
} from './middleware /registration';
import { AuthenticationController } from './auth-controller';
import { PrismaProvider } from '../global-utils/providers/prisma';
import { BcryptProvider } from './providers/bcrypt';
import {
  RateLimter,
  ValidateLoginBody,
  SanitizeLoginBody,
  ValidateUserExists,
  ValidateUserPasswordIsCorrect,
} from './middleware /login';
import { UserClass } from './providers/login';
import { AuthenticationErrorHandler } from './providers/error';
import { JwtProvider } from './providers/jwt';
import { Mailer } from './providers/email';
import {
  ChangePasswordRateLimiter,
  GenerateEmailWithVerificationCode,
  SanitizeChangePasswordBody,
  ValidateChangePasswordBody,
  ValidateEmailExists,
} from './middleware /change-password';
import { RandomCodeGenerator } from './providers/random-code';
import { UserEmailStorage } from './providers/user-email';
import {
  SanitizeVerificationCodeBody,
  ValidateEmailExistsVerificationCode,
  ValidateVerificationCode,
  ValidateVerificationCodeBody,
  VerifyCodeRateLimit,
} from './middleware /verify-code';
import {
  ResetPasswordRateLimiter,
  SanitizeResetPasswordBody,
  ValidateJwtToken,
  ValidateResetPasswordBody,
  ValidateResetPasswordHeaders,
  ValidateTokenIsNotBlacklisted,
} from './middleware /reset-password';

@Module({
  imports: [],
  controllers: [AuthenticationController],
  providers: [
    PrismaProvider,
    BcryptProvider,
    UserClass,
    AuthenticationErrorHandler,
    JwtProvider,
    Mailer,
    RandomCodeGenerator,
    UserEmailStorage,
  ],
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
        ValidateUserPasswordIsCorrect,
      )
      .forRoutes('/api/auth/login');
    consumer
      .apply(
        ChangePasswordRateLimiter,
        ValidateChangePasswordBody,
        SanitizeChangePasswordBody,
        ValidateEmailExists,
        GenerateEmailWithVerificationCode,
      )
      .forRoutes('/api/auth/change-password');
    consumer
      .apply(
        VerifyCodeRateLimit,
        ValidateVerificationCodeBody,
        SanitizeVerificationCodeBody,
        ValidateEmailExistsVerificationCode,
        ValidateVerificationCode,
      )
      .forRoutes('/api/auth/verify-code');
    consumer
      .apply(
        ResetPasswordRateLimiter,
        ValidateResetPasswordBody,
        ValidateResetPasswordHeaders,
        SanitizeResetPasswordBody,
        ValidateTokenIsNotBlacklisted,
        ValidateJwtToken,
      )
      .forRoutes('/api/auth/reset-password');
  }
}
