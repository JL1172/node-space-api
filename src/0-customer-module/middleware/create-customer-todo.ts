import * as validator from 'validator';
import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { CustomerErrorHandler } from '../providers/error';
import { NextFunction, Request, Response } from 'express';
import { plainToClass } from 'class-transformer';
import { CustomerTodo } from '../dtos/CustomerTodoBody';
import { validateOrReject } from 'class-validator';
import { JwtProvider } from '../providers/jwt';
import { CustomerPrismaProvider } from '../providers/prisma';

@Injectable()
export class ValidateCustomerTodoBody implements NestMiddleware {
  constructor(private readonly errorHandler: CustomerErrorHandler) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const objectToCompare = plainToClass(CustomerTodo, req.body);
    try {
      await validateOrReject(objectToCompare, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      next();
    } catch (err) {
      const errObj = {};
      err.forEach((n) => (errObj[n.property] = n.constraints));
      this.errorHandler.reportError(errObj, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}

@Injectable()
export class SanitizeCustomerTodoBody implements NestMiddleware {
  private readonly validate = validator;
  constructor(private readonly errorHandler: CustomerErrorHandler) {}
  use(req: Request, res: Response, next: NextFunction) {
    try {
      const keys: string[] = ['todo_description', 'todo_title'];
      const body: CustomerTodo = req.body;
      keys.forEach((n) => {
        body[n] = this.validate.escape(body[n]);
        body[n] = this.validate.trim(body[n]);
        body[n] = this.validate.blacklist(
          body[n],
          /[\x00-\x1F\s;'"\\<>]/.source,
        );
      });
      next();
    } catch (err) {
      this.errorHandler.reportError(
        'An Unexpected Problem Occurred.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

@Injectable()
export class ValidateCustomerExistsForTodo implements NestMiddleware {
  constructor(
    private readonly errorHandler: CustomerErrorHandler,
    private readonly jwt: JwtProvider,
    private readonly prisma: CustomerPrismaProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      this.jwt.validateJwtToken(req.headers.authorization);
      const id = this.jwt.getDecodedJwtToken().id;
      const customer_id = req.body.customer_id;
      const result = await this.prisma.getCustomerById(customer_id, id);
      if (!result) {
        this.errorHandler.reportError(
          'Customer Does Not Exist.',
          HttpStatus.BAD_REQUEST,
        );
      } else {
        req.body.user_id = id;
        next();
      }
    } catch (err) {
      this.errorHandler.reportError(
        err?.inner?.message || err.message || 'An Unexpected Problem Occurred.',
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
