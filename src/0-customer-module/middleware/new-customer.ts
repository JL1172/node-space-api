import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import * as rateLimit from 'express-rate-limit';
import { CustomerErrorHandler } from '../providers/error';
import { NextFunction, Request, Response } from 'express';
import { plainToClass } from 'class-transformer';
import { NewCustomerBody } from '../dtos/NewCustomerBody';
import { validateOrReject } from 'class-validator';
import * as validator from 'validator';
import { CustomerPrismaProvider } from '../providers/prisma';

@Injectable()
export class NewCustomerRateLimit implements NestMiddleware {
  constructor(private readonly errorHandler: CustomerErrorHandler) {}
  private readonly ratelimit = rateLimit.rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 100,
    handler: () => {
      this.errorHandler.reportError(
        'Too Many Requests.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    },
  });
  use(req: Request, res: Response, next: NextFunction) {
    this.ratelimit(req, res, next);
  }
}

@Injectable()
export class ValidateNewCustomerBody implements NestMiddleware {
  constructor(private readonly errorHandler: CustomerErrorHandler) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const objectToCompare = plainToClass(NewCustomerBody, req.body);
    try {
      await validateOrReject(objectToCompare, {
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
        next();
    } catch (err) {
      const errObject = {};
      err.forEach((n) => (errObject[n.property] = n.constraints));
      this.errorHandler.reportError(errObject, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}

@Injectable()
export class SanitizeNewCustomerBody implements NestMiddleware {
  private readonly validator = validator;
  constructor(private readonly errorHandler: CustomerErrorHandler) {}
  use(req: Request, res: Response, next: NextFunction) {
    try {
      const body: NewCustomerBody = req.body;
      const keys: string[] = ['email', 'full_name', 'phoneNumber', 'address'];
      keys.forEach((n) => {
        body[n] = this.validator.escape(body[n]);
        body[n] = this.validator.trim(body[n]);
        body[n] = this.validator.blacklist(
          body[n],
          /[\x00-\x1F\s;'"\\<>]/.source,
        );
      });
      req.body.email = this.validator.normalizeEmail(req.body.email);
      next();
    } catch (err) {
      this.errorHandler.reportError(
        'An Unexpected Error Occurred.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

@Injectable()
export class VerifyCustomerIsUnique implements NestMiddleware {
  constructor(
    private readonly errorHandler: CustomerErrorHandler,
    private readonly prisma: CustomerPrismaProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // const isCustomerUnique: boolean =
        // await this.prisma.verifyCustomerIsUnique(req.body);
    } catch (err) {
      this.errorHandler.reportError(
        err.message ||
          'An Unexpected Error Occurred Validating New Customer Entry.',
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
