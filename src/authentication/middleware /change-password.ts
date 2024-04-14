import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as ratelimit from 'express-rate-limit';
import { AuthenticationErrorHandler } from '../providers/error';
import { plainToClass } from 'class-transformer';
import { ChangePasswordBody } from '../dtos/ChangePasswordBody';
import { validateOrReject } from 'class-validator';
import * as validator from 'validator';
import { RandomCodeGenerator } from '../providers/random-code';
import { Mailer } from '../providers/email';
import { PrismaProvider } from 'src/global-utils/providers/prisma';
import { User } from '@prisma/client';

@Injectable()
export class ChangePasswordRateLimiter implements NestMiddleware {
  constructor(private readonly errorHandler: AuthenticationErrorHandler) {}
  private readonly limiter = ratelimit.rateLimit({
    windowMs: 1000 * 60 * 15,
    limit: 15,
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
    req.body.email = this.validate.escape(req.body.email);
    req.body.email = this.validate.trim(req.body.email);
    req.body.email = this.validate.normalizeEmail(req.body.email);
    req.body.email = this.validate.blacklist(
      req.body.email,
      /[\x00-\x1F\s;'"\\<>]/.source,
    );
    next();
  }
}
@Injectable()
export class ValidateEmailExists implements NestMiddleware {
  constructor(
    private readonly errorHandler: AuthenticationErrorHandler,
    private readonly prisma: PrismaProvider,
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
export class GenerateEmailWithVerificationCode implements NestMiddleware {
  constructor(
    private readonly errorHandler: AuthenticationErrorHandler,
    private readonly generateVerificationCode: RandomCodeGenerator,
    private readonly prisma: PrismaProvider,
    private readonly mailer: Mailer,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const userEmail: string = (
        await this.prisma.getUserByEmail(req.body.email)
      ).email;
      const random6DigitCode = this.generateVerificationCode.generateCode();
      const emailContent = `<h5>Dear ${userEmail},</h5><p>Thank you for choosing our service! To complete your password change and ensure the security of your account, please use the following verification code:</p>Verification Code: <strong>${random6DigitCode}</strong><p>Please enter this code on our website/app within the next <em>5 Minutes</em> to change your password.</p><p>If you did not request this verification code, please ignore this email.</p><p>Thank you,</p><p>Node Space Team</p>`;
      await this.mailer.draftEmail(
        userEmail,
        'Verification Code For Password Change.',
        emailContent,
      );
      await this.prisma.storeVerificationCode({
        user_email: userEmail,
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
