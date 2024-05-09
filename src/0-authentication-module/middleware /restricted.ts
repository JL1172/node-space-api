import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { AuthenticationErrorHandler } from '../providers/error';
import * as rateLimit from 'express-rate-limit';
import { NextFunction, Request, Response } from 'express';
import { JwtProvider } from '../providers/jwt';
import { JsonWebTokenError } from 'jsonwebtoken';

export const projectControllerRateLimitMax: number = 75;
@Injectable()
export class RestrictedRouteRateLimiter implements NestMiddleware {
  constructor(private readonly errorHandler: AuthenticationErrorHandler) {}
  private readonly limiter = rateLimit.rateLimit({
    windowMs: 1000 * 60 * 1,
    limit: projectControllerRateLimitMax,
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
export class ValidateJwtIsValidForRestrictedRoute implements NestMiddleware {
  constructor(
    private readonly errorHandler: AuthenticationErrorHandler,
    private readonly jwt: JwtProvider,
  ) {}
  use(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.headers.authorization === undefined) {
        this.errorHandler.reportHttpError(
          'Token Required.',
          HttpStatus.UNAUTHORIZED,
        );
      }
      const isValidJwt = this.jwt.validateJwtToken(req.headers.authorization);
      if (isValidJwt === true) next();
    } catch (err) {
      const message = err?.inner?.message || err.message;
      const status =
        err instanceof JsonWebTokenError
          ? HttpStatus.UNAUTHORIZED
          : err?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      this.errorHandler.reportHttpError(message, status);
    }
  }
}
