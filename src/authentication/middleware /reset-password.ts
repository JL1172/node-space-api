import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { AuthenticationErrorHandler } from '../providers/error';
import { NextFunction, Request, Response } from 'express';
import * as rateLimit from 'express-rate-limit';
import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { ResetPasswordBody } from '../dtos/ResetPasswordBody';
import * as validator from 'validator';
import { JWT_ROLE, JwtProvider, decodedTokenDto } from '../providers/jwt';
import { PrismaProvider } from 'src/global-utils/providers/prisma';

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
      if (req.body.password !== req.body.confirmedPassword) {
        this.errorHander.reportHttpError(
          'Passwords Must Match.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      next();
    } catch (err) {
      const errObject = {};
      err.forEach((n) => (errObject[n.property] = n.constraints));
      if (req.body.password !== req.body.confirmedPassword) {
        errObject['password'] = {
          ...errObject['password'],
          doNotMatch: 'Passwords Must Match.',
        };
        errObject['confirmedPassword'] = {
          ...errObject['confirmedPassword'],
          doNotMatch: 'Passwords Must Match.',
        };
      }
      this.errorHander.reportHttpError(
        errObject,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}

@Injectable()
export class ValidateResetPasswordHeaders implements NestMiddleware {
  constructor(private readonly errorHander: AuthenticationErrorHandler) {}
  use(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers['authorization'];
      if (token === null) {
        this.errorHander.reportHttpError(
          'Token Is Required.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      next();
    } catch (err) {
      this.errorHander.reportHttpError(
        err.message,
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
      const keys: string[] = ['password', 'confirmedPassword'];
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

@Injectable()
export class ValidateTokenIsNotBlacklisted implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaProvider,
    private readonly errorHander: AuthenticationErrorHandler,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const token = await this.prisma.getJwtByToken(
        req.headers['authorization'],
      );
      if (token !== null) {
        this.errorHander.reportHttpError(
          'Invalid Token [403].',
          HttpStatus.UNAUTHORIZED,
        );
      }
      next();
    } catch (err) {
      this.errorHander.reportHttpError(
        err.message || err,
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

//next thing authorize jwt token
@Injectable()
export class ValidateJwtToken implements NestMiddleware {
  constructor(
    private readonly errorHander: AuthenticationErrorHandler,
    private readonly jwt: JwtProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers['authorization'];
      const result: boolean = this.jwt.validateJwtToken(token);
      const decodedToken: decodedTokenDto = this.jwt.getDecodedJwtToken();
      if (decodedToken.jwt_role !== JWT_ROLE.RESET_PASSWORD) {
        this.errorHander.reportHttpError(
          'Invalid Token Type.',
          HttpStatus.UNAUTHORIZED,
        );
      }
      if (result === true) {
        next();
      }
    } catch (err) {
      this.errorHander.reportHttpError(
        err,
        err.status ? err.status : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
