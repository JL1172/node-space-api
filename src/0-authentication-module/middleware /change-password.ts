import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as ratelimit from 'express-rate-limit';
import { AuthenticationErrorHandler } from '../providers/error';
import { plainToClass } from 'class-transformer';
import { ChangePasswordBody } from '../dtos/ChangePasswordBody';
import { validateOrReject } from 'class-validator';
import * as validator from 'validator';
import { RandomCodeGenerator } from '../providers/random-code';
import { EmailMarkup, Mailer } from '../providers/email';
import { User } from '@prisma/client';
import { UserEmailStorage } from '../providers/user-email';
import { AuthenticationPrismaProvider } from '../providers/prisma';

@Injectable()
export class ChangePasswordRateLimiter implements NestMiddleware {
  constructor(private readonly errorHandler: AuthenticationErrorHandler) {}
  private readonly limiter = ratelimit.rateLimit({
    windowMs: 1000 * 60 * 15,
    limit: 5,
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
export class ValidateChangePasswordBody implements NestMiddleware {
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
export class SanitizeChangePasswordBody implements NestMiddleware {
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
export class ValidateEmailExists implements NestMiddleware {
  constructor(
    private readonly errorHandler: AuthenticationErrorHandler,
    private readonly prisma: AuthenticationPrismaProvider,
    private readonly userStorage: UserEmailStorage,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const isValidUser: User = await this.prisma.getUserByEmail(
        req.body.email,
      );
      if (isValidUser !== null) {
        this.userStorage.setUserEmail(isValidUser.email);
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
export class GenerateEmailWithVerificationCode implements NestMiddleware {
  constructor(
    private readonly errorHandler: AuthenticationErrorHandler,
    private readonly generateVerificationCode: RandomCodeGenerator,
    private readonly prisma: AuthenticationPrismaProvider,
    private readonly mailer: Mailer,
    private readonly userStorage: UserEmailStorage,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const email: string = this.userStorage.getUserEmail();
      const random6DigitCode = this.generateVerificationCode.generateCode();
      await this.mailer.draftEmail(
        email,
        'Verification Code For Password Change.',
        EmailMarkup.PASSWORD_RESET,
        random6DigitCode,
      );
      await this.prisma.storeVerificationCode({
        user_email: email,
        expiration_date: this.generateVerificationCode.getExpirationDate(),
        verification_code: random6DigitCode,
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
