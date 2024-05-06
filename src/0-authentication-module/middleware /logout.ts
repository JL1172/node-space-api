import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as ratelimter from 'express-rate-limit';
import { AuthenticationErrorHandler } from '../providers/error';
import { JwtProvider } from '../providers/jwt';

@Injectable()
export class LogoutRateLimiter implements NestMiddleware {
  constructor(private readonly errorHandler: AuthenticationErrorHandler) {}
  private readonly ratelimit = ratelimter.rateLimit({
    limit: 10,
    windowMs: 1000 * 60 * 1,
    handler: () => {
      this.errorHandler.reportHttpError(
        'Too Many Logout Requests.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    },
  });
  use(req: Request, res: Response, next: NextFunction) {
    this.ratelimit(req, res, next);
  }
}

@Injectable()
export class ValidateLogoutBody implements NestMiddleware {
  constructor(private readonly errorHandler: AuthenticationErrorHandler) {}
  use(req: Request, res: Response, next: NextFunction) {
    if (!req.headers.authorization) {
      this.errorHandler.reportHttpError(
        'Token Required.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    next();
  }
}

@Injectable()
export class ValidateJwtTokenForLogout implements NestMiddleware {
  constructor(
    private readonly errorHander: AuthenticationErrorHandler,
    private readonly jwt: JwtProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers['authorization'];
      const result: boolean = this.jwt.validateJwtToken(token);
      if (result === true) {
        next();
      } else {
        this.errorHander.reportHttpError(
          'Unexpect Problem Occurred With Token Verification, Logging Out.',
          HttpStatus.UNAUTHORIZED,
        );
      }
    } catch (err) {
      this.errorHander.reportHttpError(
        err?.inner?.message ? err.inner.message : err.message,
        err.status ? err.status : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
