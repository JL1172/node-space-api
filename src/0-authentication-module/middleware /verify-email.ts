import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as ratelimit from 'express-rate-limit';
import { AuthenticationErrorHandler } from '../providers/error';
import { plainToClass } from 'class-transformer';
import { VerificationCodeBody } from '../dtos/VerificationCodeBody';
import { validateOrReject } from 'class-validator';
import * as validator from 'validator';
import { VerificationCode } from '@prisma/client';
import { AuthenticationPrismaProvider } from '../providers/prisma';
import { EmailMarkup } from '../providers/email';

@Injectable()
export class VerifyCodeRateLimitRegistration implements NestMiddleware {
  constructor(private readonly errorHandler: AuthenticationErrorHandler) {}
  private readonly limiter = ratelimit.rateLimit({
    windowMs: 1000 * 15 * 60,
    limit: 10,
    handler: () => {
      this.errorHandler.reportHttpError(
        'Too Many Requests.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    },
  });
  use(req: Request, res: Response, next: NextFunction) {
    this.limiter(req, res, next);
  }
}

@Injectable()
export class ValidateVerificationCodeBodyRegistration
  implements NestMiddleware
{
  constructor(private readonly errorHandler: AuthenticationErrorHandler) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const objectToValidate = plainToClass(VerificationCodeBody, req.body);
    try {
      await validateOrReject(objectToValidate, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      next();
    } catch (err) {
      const errObject = {};
      err.forEach((n) => (errObject[n.property] = n.constraints));
      this.errorHandler.reportHttpError(
        errObject,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}

@Injectable()
export class SanitizeVerificationCodeBodyRegistration
  implements NestMiddleware
{
  private readonly validate = validator;
  constructor(private readonly errorHandler: AuthenticationErrorHandler) {}
  use(req: Request, res: Response, next: NextFunction) {
    try {
      const keys: string[] = ['email', 'verification_code'];
      keys.forEach((n) => {
        req.body[n] = this.validate.trim(req.body[n]);
        req.body[n] = this.validate.escape(req.body[n]);
        req.body[n] = this.validate.blacklist(
          req.body[n],
          /[\x00-\x1F\s;'"\\<>]/.source,
        );
      });
      req.body.email = this.validate.normalizeEmail(req.body.email);
      next();
    } catch (err) {
      this.errorHandler.reportHttpError(
        'An Unexpected Problem Occurred.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

@Injectable()
export class ValidateEmailExistsVerificationCodeRegistration
  implements NestMiddleware
{
  constructor(
    private readonly errorHandler: AuthenticationErrorHandler,
    private readonly prisma: AuthenticationPrismaProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const userEmail = await this.prisma.getUserByEmail(req.body.email);
      if (userEmail === null) {
        this.errorHandler.reportHttpError(
          'Account Not Found. Restart Process.',
          HttpStatus.BAD_REQUEST,
        );
      } else if (userEmail.email_verified === true) {
        this.errorHandler.reportHttpError(
          'Account Already Verified. Proceed To Sign In.',
          HttpStatus.BAD_REQUEST,
        );
      } else {
        next();
      }
    } catch (err) {
      const message =
        err.message === 'Account Not Found. Restart Process.'
          ? err.message
          : 'Internal Server Error.';
      const status =
        err.status === 400 ? err.status : HttpStatus.INTERNAL_SERVER_ERROR;
      this.errorHandler.reportHttpError(message, status);
    }
  }
}

@Injectable()
export class ValidateVerificationCodeRegistration implements NestMiddleware {
  constructor(
    private readonly errorHandler: AuthenticationErrorHandler,
    private readonly prisma: AuthenticationPrismaProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const lastVerificationCode: VerificationCode =
        await this.prisma.getLastVerificationCode(
          req.body.email,
          EmailMarkup.VERIFY_EMAIL,
        );
      //ensures there is a code and that it isnt false
      if (
        lastVerificationCode === null ||
        lastVerificationCode.is_valid === false
      ) {
        this.errorHandler.reportHttpError(
          'Verification Code Either Does Not Exist Or Is Expired.',
          HttpStatus.FORBIDDEN,
        );
      }
      //tests if code is past its expiration
      if (lastVerificationCode.expiration_date <= new Date()) {
        lastVerificationCode['is_valid'] = false;
        await this.prisma.updateLastVerificationCodeValidity(
          lastVerificationCode.id,
          lastVerificationCode,
        );
        this.errorHandler.reportHttpError(
          'Code Expired, Click Button To Generate A New Code.',
          HttpStatus.BAD_REQUEST,
        );
      }
      //tests if code is the same as the one given
      if (
        req.body.verification_code !== lastVerificationCode.verification_code
      ) {
        this.errorHandler.reportHttpError(
          'Invalid Verification Code.',
          HttpStatus.FORBIDDEN,
        );
      }
      lastVerificationCode['is_valid'] = false;
      await this.prisma.updateLastVerificationCodeValidity(
        lastVerificationCode.id,
        lastVerificationCode,
      );
      next();
    } catch (err) {
      const message = err.message;
      const status = err.status;
      this.errorHandler.reportHttpError(message, status);
    }
  }
}
