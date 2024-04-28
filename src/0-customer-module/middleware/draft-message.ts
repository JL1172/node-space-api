import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import * as ratelimiter from 'express-rate-limit';
import { CustomerErrorHandler } from '../providers/error';
import { NextFunction, Request, Response } from 'express';
import { JwtProvider } from '../providers/jwt';
import { JsonWebTokenError } from 'jsonwebtoken';

export const maxRateLimitForDraftMessageEndpoint: number = 50;
@Injectable()
export class DraftMessageRateLimit implements NestMiddleware {
  constructor(private readonly errorHandler: CustomerErrorHandler) {}
  private readonly ratelimit = ratelimiter.rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: maxRateLimitForDraftMessageEndpoint,
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
export class VerifyJwtIsValidForDraftMessageToCustomerEndpoint
  implements NestMiddleware
{
  constructor(
    private readonly errorHandler: CustomerErrorHandler,
    private readonly jwt: JwtProvider,
  ) {}
  use(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.headers.authorization === undefined) {
        this.errorHandler.reportError(
          'Token Required.',
          HttpStatus.UNAUTHORIZED,
        );
      }
      const isValid: boolean = this.jwt.validateJwtToken(
        req.headers.authorization,
      );
      if (isValid === true) {
        next();
      } else {
        this.errorHandler.reportError(
          'An Unexpected Problem Occurred.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (err) {
      const message =
        err instanceof JsonWebTokenError
          ? err.inner.message
          : err.message
            ? err.message
            : err;
      this.errorHandler.reportError(
        message,
        err.status ? err.status : HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
