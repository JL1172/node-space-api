import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import * as validator from 'validator';
import * as rateLimit from 'express-rate-limit';
import { NextFunction, Request, Response } from 'express';
import { plainToClass } from 'class-transformer';
import { RegistrationBody } from '../dtos/RegistrationBody';
import { validateOrReject } from 'class-validator';
import { PrismaProvider } from 'src/global-utils/providers/prisma';
import { AuthenticationErrorHandler } from '../providers/error';

@Injectable()
export class RateLimiter implements NestMiddleware {
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
export class ValidateBody implements NestMiddleware {
  constructor(private readonly errorHander: AuthenticationErrorHandler) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const objectToProccess = plainToClass(RegistrationBody, req.body);
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
export class SanitizeBody implements NestMiddleware {
  private readonly validator = validator;
  use(req: Request, res: Response, next: NextFunction) {
    const body: RegistrationBody = req.body;
    const keys: string[] = [
      'email',
      'password',
      'age',
      'email',
      'first_name',
      'last_name',
      'username',
    ];
    keys.forEach((n: string) => {
      body[n] = this.validator.escape(body[n]);
      body[n] = this.validator.trim(body[n]);
      body[n] = this.validator.blacklist(
        body[n],
        /[\x00-\x1F\s;'"\\<>]/.source,
      );
    });
    req.body.email = this.validator.normalizeEmail(body['email']);
    body['age'] = Number(body['age']);
    next();
  }
}

@Injectable()
export class VerifyUserIsUnique implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaProvider,
    private readonly errorHander: AuthenticationErrorHandler,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const result: boolean[] = await this.prisma.isUserUnique(
        req.body.email,
        req.body.username,
      );
      if (result[0] === false || result[1] === false) {
        const errorMessage: string = `${
          result[0] === false && result[1] === false
            ? 'Username and Email Already Associated With A Different Account.'
            : result[0] === false && result[1] === true
              ? 'Email Already Associated With Another Account.'
              : 'Username Already Associated With Another Account.'
        }`;
        this.errorHander.reportHttpError(errorMessage, HttpStatus.BAD_REQUEST);
      }
      next();
    } catch (err) {
      this.errorHander.reportHttpError(
        /Already/i.test(err.message) ? err.message : 'Internal Server Error',
        err.status ? err.status : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
