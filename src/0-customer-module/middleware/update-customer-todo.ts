import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { CustomerErrorHandler } from '../providers/error';
import { JwtProvider } from '../providers/jwt';
import { CustomerPrismaProvider } from '../providers/prisma';
import { NextFunction, Request, Response } from 'express';
import { plainToClass } from 'class-transformer';
import { UpdatedCustomerTodo } from '../dtos/UpdatedCustomerTodoBody';
import { validateOrReject } from 'class-validator';

@Injectable()
export class ValidateUpdatedCustomerTodoBody implements NestMiddleware {
  constructor(private readonly errorHandler: CustomerErrorHandler) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const objectToCompare = plainToClass(UpdatedCustomerTodo, req.body);
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
export class ValidateTodoExists implements NestMiddleware {
  constructor(
    private readonly errorHandler: CustomerErrorHandler,
    private readonly jwt: JwtProvider,
    private readonly prisma: CustomerPrismaProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const body: UpdatedCustomerTodo = req.body;
      const result = await this.prisma.getTodoById(
        body.id,
        body.customer_id,
        body.user_id,
      );
      if (result === null) {
        this.errorHandler.reportError(
          'Todo Does Not Exist.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      } else {
        next();
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
export class ValidateTodoIsUniqueForUpdateInstance implements NestMiddleware {
  constructor(
    private readonly errorHandler: CustomerErrorHandler,
    private readonly jwt: JwtProvider,
    private readonly prisma: CustomerPrismaProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      this.jwt.validateJwtToken(req.headers.authorization);
      const id = this.jwt.getDecodedJwtToken().id;
      const result = await this.prisma.validateTodoIsUniqueBesidesItself(
        req.body,
        id,
      );
      if (result !== null) {
        this.errorHandler.reportError(
          'Todo With Same Customer, Same Deadline, And Same Title Already Exist.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      } else {
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
