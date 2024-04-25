import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import * as rateLimit from 'express-rate-limit';
import { CustomerErrorHandler } from '../providers/error';
import { NextFunction, Request, Response } from 'express';
import { plainToClass } from 'class-transformer';
import { NewCustomerBody } from '../dtos/NewCustomerBody';
import { validateOrReject } from 'class-validator';

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
