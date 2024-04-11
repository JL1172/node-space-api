import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { NextFunction, Request, Response } from 'express';
import * as ratelimit from 'express-rate-limit';
import { LoginBody } from '../dtos/LoginBody';
import { validateOrReject } from 'class-validator';
import * as validator from 'validator';
import { PrismaProvider } from 'src/global-utils/providers/prisma';
import { UserClass } from '../providers/login';

@Injectable()
export class RateLimter implements NestMiddleware {
  private readonly limiter = ratelimit.rateLimit({
    windowMs: 1000 * 15 * 60,
    limit: 10,
    handler: () => {
      throw new HttpException(
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
      throw new HttpException(errObject, HttpStatus.UNPROCESSABLE_ENTITY);
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
      body[n] = this.validator.escape(body[n]);
      body[n] = this.validator.trim(body[n]);
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
    private readonly prisma: PrismaProvider,
    private readonly userClass: UserClass,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const isValidUser = await this.prisma.getUserByUsername(
        req.body.username,
      );
      if (isValidUser === null) {
        throw new HttpException(
          'Username Or Password Is Incorrect.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      this.userClass.setUser(isValidUser);
      next();
    } catch (err) {
      throw new HttpException(err, HttpStatus.BAD_REQUEST);
    }
  }
}

/*need to do compare funciton
@Injectable()
export class ValidateUserPasswordIsCorrect implements NestMiddleware {
  constructor(private readonly userClass: UserClass) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
        
    } catch (err) {
      throw new HttpException(err, HttpStatus.UNAUTHORIZED);
    }
  }
}
*/
