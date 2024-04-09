import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class ValidateRegistrationBody implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const registrationBody = plainToClass(ValidateRegistrationBody, req.body);
    try {
      await validateOrReject(registrationBody, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      next();
    } catch (err: any) {
      const error_object: Record<string, string> = {};
      err.forEach((n) => (error_object[n.property] = n.constraints));
      throw new HttpException(error_object, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}
