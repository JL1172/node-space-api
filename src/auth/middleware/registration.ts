import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { NextFunction, Request, Response } from 'express';
import { RegistrationBody } from '../dtos/RegistrationBody';
import { validateOrReject } from 'class-validator';
import * as limiter from 'express-rate-limit';
import * as validator from 'validator';
import { PrismaProvider } from 'src/global-utils/providers/prisma';
import { User } from '@prisma/client';

@Injectable()
export class RegisterRateLimit implements NestMiddleware {
  private readonly rateLimit = limiter.rateLimit({
    limit: 25,
    windowMs: 1000 * 15 * 60,
    handler: () => {
      throw new HttpException(
        'Too Many Registration Attempts.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    },
  });
  use(req: Request, res: Response, next: NextFunction) {
    this.rateLimit(req, res, next);
  }
}
@Injectable()
export class ValidateRegistrationBody implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const validatedObject = plainToClass(RegistrationBody, req.body);
    try {
      await validateOrReject(validatedObject, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      next();
    } catch (err) {
      const errObject = {};
      err.forEach((n) => (errObject[n.property] = n.constraints));
      throw new HttpException(errObject, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}
@Injectable()
export class SanitizeRegistrationBody implements NestMiddleware {
  private readonly validator = validator;
  use(req: Request, res: Response, next: NextFunction) {
    const fieldNames: string[] = [
      'first_name',
      'last_name',
      'username',
      'age',
      'password',
    ];
    fieldNames.forEach((n: string) => {
      req.body[n] = this.validator.escape(req.body[n]);
      req.body[n] = this.validator.trim(req.body[n]);
      req.body[n] = this.validator.blacklist(
        req.body[n],
        /[\x00-\x1F\s;'"\\<>]/.source,
      );
    });
    req.body['email'] = this.validator.normalizeEmail(req.body['email']);
    req.body['age'] = Number(req.body.age);
    next();
  }
}

@Injectable()
export class VerifyUserIsUnique implements NestMiddleware {
  constructor(private readonly prisma: PrismaProvider) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const isUsernameUnique: User = await this.prisma.getUserbyUsername(
        req.body.username,
      );
      if (isUsernameUnique !== null) {
        throw new HttpException(
          `Username: ${req.body.username} Not Available.`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      const isEmailUnique: User = await this.prisma.getUserByEmail(
        req.body.email,
      );
      if (isEmailUnique !== null) {
        throw new HttpException(
          `Email: ${req.body.email} Is Already Associated With Another Account.`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      next();
    } catch (err: unknown) {
      throw new HttpException(err, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}
