import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import * as ratelimit from 'express-rate-limit';
import { ProjectErrorHandler } from '../providers/error';
import { NextFunction, Request, Response } from 'express';
import { JwtProvider } from '../providers/jwt';
import { ProjectPrismaProvider } from '../providers/prisma';

export const projectControllerRateLimitMax: number = 75;
@Injectable()
export class ProjectControllerRateLimiter implements NestMiddleware {
  constructor(private readonly errorHandler: ProjectErrorHandler) {}
  private readonly limiter = ratelimit.rateLimit({
    windowMs: 1000 * 60 * 1,
    limit: projectControllerRateLimitMax,
    handler: () => {
      this.errorHandler.reportError(
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
export class VerifyTokenIsNotBlacklisted implements NestMiddleware {
  constructor(
    private readonly jwt: JwtProvider,
    private readonly errorHandler: ProjectErrorHandler,
    private readonly prisma: ProjectPrismaProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.headers.authorization) {
        this.errorHandler.reportError(
          'Token Required.',
          HttpStatus.UNAUTHORIZED,
        );
      } else {
        const result = await this.prisma.getJwtByToken(
          req.headers.authorization,
        );
        if (result !== null) {
          this.errorHandler.reportError(
            'Invalid Token [403]',
            HttpStatus.UNAUTHORIZED,
          );
        } else {
          next();
        }
      }
    } catch (err) {
      this.errorHandler.reportError(
        err.message || 'An Unexpected Problem Occurred.',
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
@Injectable()
export class VerifyTokenIsValid implements NestMiddleware {
  constructor(
    private readonly jwt: JwtProvider,
    private readonly errorHandler: ProjectErrorHandler,
  ) {}
  use(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.headers.authorization) {
        this.errorHandler.reportError(
          'Token Required.',
          HttpStatus.UNAUTHORIZED,
        );
      } else {
        const result: boolean = this.jwt.validateJwtToken(
          req.headers.authorization,
        );
        if (result === true) {
          next();
        } else {
          this.errorHandler.reportError(
            'An Unexpected Error Occurred.',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }
    } catch (err) {
      const message =
        err?.inner?.message || err.message || 'An Unexpected Problem Occurred.';
      const status = err?.inner?.message
        ? HttpStatus.UNAUTHORIZED
        : err.status || HttpStatus.INTERNAL_SERVER_ERROR;
      this.errorHandler.reportError(message, status);
    }
  }
}
