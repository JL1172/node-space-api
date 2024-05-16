import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import {
  RateLimiter,
  SanitizeBody,
  ValidateBody,
  VerifyUserIsUnique,
} from './middleware /registration';
import { AuthenticationController } from './auth-controller';
import { BcryptProvider } from './providers/bcrypt';
import {
  RateLimter,
  ValidateLoginBody,
  SanitizeLoginBody,
  ValidateUserExists,
  ValidateUserPasswordIsCorrect,
  ValidateUserEmailIsVerified,
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
import { SingletonPrismaProvider } from '../global/global-utils/providers/singleton-prisma';
import { AuthenticationPrismaProvider } from './providers/prisma';
import {
  LogoutRateLimiter,
  ValidateJwtTokenForLogout,
  ValidateLogoutBody,
} from './middleware /logout';
import {
  RestrictedRouteRateLimiter,
  ValidateJwtIsValidForRestrictedRoute,
} from './middleware /restricted';
import {
  SanitizeVerificationCodeBodyRegistration,
  ValidateEmailExistsVerificationCodeRegistration,
  ValidateVerificationCodeBodyRegistration,
  ValidateVerificationCodeRegistration,
  VerifyCodeRateLimitRegistration,
} from './middleware /verify-email';
import {
  GenerateEmailForEmailVerificationForGenerateEndpoint,
  GenerateEndpointRateLimiter,
  SanitizeChangePasswordBodyForGenerateEndpoint,
  ValidateEmailExistsForGenerateEndpoint,
  ValidateGenerateVerificationCodeBodyForGenerateEndpoint,
} from './middleware /generate-verification-code';

@Module({
  imports: [],
  controllers: [AuthenticationController],
  providers: [
    AuthenticationPrismaProvider,
    BcryptProvider,
    UserClass,
    AuthenticationErrorHandler,
    JwtProvider,
    Mailer,
    RandomCodeGenerator,
    UserEmailStorage,
    SingletonPrismaProvider,
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
        ValidateUserEmailIsVerified,
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
        GenerateEndpointRateLimiter,
        ValidateGenerateVerificationCodeBodyForGenerateEndpoint,
        SanitizeChangePasswordBodyForGenerateEndpoint,
        ValidateEmailExistsForGenerateEndpoint,
        GenerateEmailForEmailVerificationForGenerateEndpoint,
      )
      .forRoutes('/api/auth/generate-verification-code');
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
        VerifyCodeRateLimitRegistration,
        ValidateVerificationCodeBodyRegistration,
        SanitizeVerificationCodeBodyRegistration,
        ValidateEmailExistsVerificationCodeRegistration,
        ValidateVerificationCodeRegistration,
      )
      .forRoutes('/api/auth/verify-email');
    consumer
      .apply(
        ResetPasswordRateLimiter,
        ValidateTokenIsNotBlacklisted,
        ValidateJwtToken,
        ValidateResetPasswordBody,
        ValidateResetPasswordHeaders,
        SanitizeResetPasswordBody,
      )
      .forRoutes('/api/auth/reset-password');
    consumer
      .apply(
        LogoutRateLimiter,
        ValidateLogoutBody,
        ValidateTokenIsNotBlacklisted,
        ValidateJwtTokenForLogout,
      )
      .forRoutes('/api/auth/logout');
    consumer
      .apply(
        RestrictedRouteRateLimiter,
        ValidateTokenIsNotBlacklisted,
        ValidateJwtIsValidForRestrictedRoute,
      )
      .forRoutes('/api/auth/restricted');
  }
}
