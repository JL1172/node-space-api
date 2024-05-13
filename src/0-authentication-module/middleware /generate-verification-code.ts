import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { AuthenticationErrorHandler } from '../providers/error';
import { RandomCodeGenerator } from '../providers/random-code';
import { AuthenticationPrismaProvider } from '../providers/prisma';
import { EmailMarkup, Mailer } from '../providers/email';
import { NextFunction, Request, Response } from 'express';
import { User } from '@prisma/client';
import * as validator from 'validator';
import * as ratelimit from 'express-rate-limit';
import { plainToClass } from 'class-transformer';
import { ChangePasswordBody } from '../dtos/ChangePasswordBody';
import { validateOrReject } from 'class-validator';

@Injectable()
export class GenerateEndpointRateLimiter implements NestMiddleware {
  constructor(private readonly errorHandler: AuthenticationErrorHandler) {}
  private readonly limiter = ratelimit.rateLimit({
    windowMs: 1000 * 60 * 15,
    limit: 25,
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
export class ValidateGenerateVerificationCodeBodyForGenerateEndpoint
  implements NestMiddleware
{
  constructor(private readonly errorHandler: AuthenticationErrorHandler) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const objectToValidate = plainToClass(ChangePasswordBody, req.body);
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
export class SanitizeChangePasswordBodyForGenerateEndpoint
  implements NestMiddleware
{
  constructor(private readonly errorHandler: AuthenticationErrorHandler) {}
  private readonly validate = validator;
  use(req: Request, res: Response, next: NextFunction) {
    try {
      req.body.email = this.validate.escape(req.body.email);
      req.body.email = this.validate.trim(req.body.email);
      req.body.email = this.validate.normalizeEmail(req.body.email);
      req.body.email = this.validate.blacklist(
        req.body.email,
        /[\x00-\x1F\s;'"\\<>]/.source,
      );
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
export class ValidateEmailExistsForGenerateEndpoint implements NestMiddleware {
  constructor(
    private readonly errorHandler: AuthenticationErrorHandler,
    private readonly prisma: AuthenticationPrismaProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const isValidUser: User = await this.prisma.getUserByEmail(
        req.body.email,
      );
      if (isValidUser !== null) {
        next();
      } else {
        this.errorHandler.reportHttpError(
          'Account Not Found.',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (err) {
      this.errorHandler.reportHttpError(
        err.message && err.message === 'Account Not Found.' ? err.message : err,
        err.status ? err.status : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

@Injectable()
export class GenerateEmailForEmailVerificationForGenerateEndpoint
  implements NestMiddleware
{
  constructor(
    private readonly errorHandler: AuthenticationErrorHandler,
    private readonly generateVerificationCode: RandomCodeGenerator,
    private readonly prisma: AuthenticationPrismaProvider,
    private readonly mailer: Mailer,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const email: string = req.body.email;
      const random6DigitCode = this.generateVerificationCode.generateCode();
      await this.mailer.draftEmail(
        email,
        'Email Verification.',
        EmailMarkup.VERIFY_EMAIL,
        random6DigitCode,
      );
      await this.prisma.storeVerificationCode({
        user_email: email,
        expiration_date: this.generateVerificationCode.getExpirationDate(),
        verification_code: random6DigitCode,
        code_type: EmailMarkup.VERIFY_EMAIL,
      });
      next();
    } catch (err) {
      this.errorHandler.reportHttpError(
        'An Unexpected Problem Occurred.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
