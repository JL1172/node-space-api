import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import * as rateLimit from 'express-rate-limit';
import { CustomerErrorHandler } from '../providers/error';
import { NextFunction, Request, Response } from 'express';
import { plainToClass } from 'class-transformer';
import { NewCustomerBody } from '../dtos/NewCustomerBody';
import { validateOrReject } from 'class-validator';
import * as validator from 'validator';
import { CustomerPrismaProvider } from '../providers/prisma';
import { JwtProvider } from '../providers/jwt';

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
export class ValidateJwtIsValid implements NestMiddleware {
  constructor(
    private readonly errorHandler: CustomerErrorHandler,
    private readonly jwt: JwtProvider,
  ) {}
  use(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.headers.authorization === null) {
        this.errorHandler.reportError(
          'Token Required.',
          HttpStatus.UNAUTHORIZED,
        );
      }
      const isValidJwt = this.jwt.validateJwtToken(req.headers.authorization);
      if (isValidJwt === true) next();
      this.errorHandler.reportError('Error', HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (err) {
      this.errorHandler.reportError(
        err.message || 'An Unexpected Error Occurred.',
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
    private readonly jwt: JwtProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const id = this.jwt.getDecodedJwtToken().id;
      const isCustomerUnique: boolean =
        await this.prisma.verifyCustomerIsUnique(id, req.body);
      if (isCustomerUnique === false) {
        this.errorHandler.reportError(
          'Error Creating New Customer, Customer With One Of The Following Already Exists: email, phone number, address, full name.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    } catch (err) {
      this.errorHandler.reportError(
        err.message ||
          'An Unexpected Error Occurred Validating New Customer Entry.',
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
