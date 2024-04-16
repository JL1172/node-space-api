import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { AuthenticationErrorHandler } from '../providers/error';
import { NextFunction, Request, Response } from 'express';
import * as rateLimit from 'express-rate-limit';
import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { ResetPasswordBody } from '../dtos/ResetPasswordBody';
import * as validator from 'validator';

@Injectable()
export class ResetPasswordRateLimiter implements NestMiddleware {
  constructor(private readonly errorHander: AuthenticationErrorHandler) {}
  private readonly limiter: rateLimit.RateLimitRequestHandler =
    rateLimit.rateLimit({
      windowMs: 1000 * 15 * 60,
      limit: 25,
      handler: () => {
        this.errorHander.reportHttpError(
          'Too Many Registration Attempts.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      },
    });
  use(req: Request, res: Response, next: NextFunction) {
    this.limiter(req, res, next);
  }
}

@Injectable()
export class ValidateResetPasswordBody implements NestMiddleware {
  constructor(private readonly errorHander: AuthenticationErrorHandler) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const objectToProccess = plainToClass(ResetPasswordBody, req.body);
    try {
      await validateOrReject(objectToProccess, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      next();
    } catch (err) {
      const errObject = {};
      err.forEach((n) => (errObject[n.property] = n.constraints));
      this.errorHander.reportHttpError(
        errObject,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}

@Injectable()
export class ValidatePasswordsMatch implements NestMiddleware {
  constructor(private readonly errorHander: AuthenticationErrorHandler) {}
  use(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.body.password !== req.body.confirmedPassword) {
        this.errorHander.reportHttpError(
          'Passwords Must Match.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      next();
    } catch (err) {
      this.errorHander.reportHttpError(
        err,
        (err.status && err.status) || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

@Injectable()
export class SanitizeResetPasswordBody implements NestMiddleware {
  constructor(private readonly errorHander: AuthenticationErrorHandler) {}
  private readonly validator = validator;
  use(req: Request, res: Response, next: NextFunction) {
    try {
      const body: ResetPasswordBody = req.body;
      const keys: string[] = ['token', 'password', 'confirmedPassword'];
      keys.forEach((n: string) => {
        body[n] = this.validator.escape(body[n]);
        body[n] = this.validator.trim(body[n]);
        body[n] = this.validator.blacklist(
          body[n],
          /[\x00-\x1F\s;'"\\<>]/.source,
        );
      });
      next();
    } catch (err) {
      this.errorHander.reportHttpError(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
