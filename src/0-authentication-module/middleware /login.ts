import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { NextFunction, Request, Response } from 'express';
import * as ratelimit from 'express-rate-limit';
import { LoginBody } from '../dtos/LoginBody';
import { validateOrReject } from 'class-validator';
import * as validator from 'validator';
import { UserClass } from '../providers/login';
import { BcryptProvider } from '../providers/bcrypt';
import { AuthenticationErrorHandler } from '../providers/error';
import { SLEEP, Timing } from '../providers/delay';
import { AuthenticationPrismaProvider } from '../providers/prisma';

@Injectable()
export class RateLimter implements NestMiddleware {
  constructor(private readonly errorHandler: AuthenticationErrorHandler) {}
  private readonly limiter = ratelimit.rateLimit({
    windowMs: 1000 * 15 * 60,
    limit: 10,
    handler: () => {
      this.errorHandler.reportHttpError(
        'Too Many Login Requests.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    },
  });
  use(req: Request, res: Response, next: NextFunction) {
    this.limiter(req, res, next);
  }
}

@Injectable()
export class ValidateLoginBody implements NestMiddleware {
  constructor(private readonly errorHandler: AuthenticationErrorHandler) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const objectToProccess = plainToClass(LoginBody, req.body);
    try {
      await validateOrReject(objectToProccess, {
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
export class SanitizeLoginBody implements NestMiddleware {
  private readonly validator = validator;
  use(req: Request, res: Response, next: NextFunction) {
    const body: LoginBody = req.body;
    const keys: string[] = ['username', 'password'];
    keys.forEach((n) => {
      body[n] = this.validator.trim(body[n]);
      body[n] = this.validator.escape(body[n]);
      body[n] = this.validator.blacklist(
        body[n],
        /[\x00-\x1F\s;'"\\<>]/.source,
      );
    });
    next();
  }
}

@Injectable()
export class ValidateUserExists implements NestMiddleware {
  constructor(
    private readonly errorHandler: AuthenticationErrorHandler,
    private readonly prisma: AuthenticationPrismaProvider,
    private readonly userClass: UserClass,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const isValidUser = await this.prisma.getUserByUsername(
        req.body.username,
      );
      if (isValidUser === null) {
        this.errorHandler.reportHttpError(
          'Username Or Password Is Incorrect.',
          HttpStatus.FORBIDDEN,
        );
      }
      this.userClass.setUser(isValidUser);
      next();
    } catch (err) {
      await Timing.delay(SLEEP.TWO_FIFTY);
      this.errorHandler.reportHttpError(
        err.message === 'Username Or Password Is Incorrect.'
          ? err.message
          : 'Internal Server Error.',
        err.status ? err.status : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

/*need to do compare funciton*/
@Injectable()
export class ValidateUserPasswordIsCorrect implements NestMiddleware {
  constructor(
    private readonly userClass: UserClass,
    private readonly errorHandler: AuthenticationErrorHandler,
    private readonly bcrypt: BcryptProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const passwordToCompare: string = this.userClass.getUser().password;
      const result: boolean = await this.bcrypt.comparePassword(
        req.body.password,
        passwordToCompare,
      );
      if (result === false) {
        this.errorHandler.reportHttpError(
          'Username Or Password Is Incorrect.',
          HttpStatus.FORBIDDEN,
        );
      }
      next();
    } catch (err) {
      this.errorHandler.reportHttpError(
        err.message === 'Username Or Password Is Incorrect.'
          ? err.message
          : 'Internal Server Error.',
        err.status ? err.status : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
