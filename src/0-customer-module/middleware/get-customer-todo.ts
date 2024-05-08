import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { CustomerErrorHandler } from '../providers/error';
import { NextFunction, Request, Response } from 'express';
import { plainToClass } from 'class-transformer';
import {
  QueryParamsIdAllTodoEndpointBody,
  QueryParamsTodoEndpointBody,
} from '../dtos/GetCustomerTodoBodies';
import { validateOrReject } from 'class-validator';
import { JwtProvider } from '../providers/jwt';
import { CustomerPrismaProvider } from '../providers/prisma';

@Injectable()
export class SetDefaultQueryParamsForGetTodoEndpoint implements NestMiddleware {
  constructor(private readonly errorHander: CustomerErrorHandler) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        limit = '10',
        sortBy = 'urgent',
        page = '1',
        id = 'all',
        cid,
        completed = 'all',
      } = req.query;
      req.query = { limit, sortBy, page, id, cid, completed };
      next();
    } catch (err) {
      this.errorHander.reportError(
        'An Unexpected Problem Occurred.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

@Injectable()
export class ValidateQueryParamsForGetTodoEndpoint implements NestMiddleware {
  constructor(private readonly errorHander: CustomerErrorHandler) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const objectToCompareIdNumInstance = plainToClass(
      QueryParamsTodoEndpointBody,
      req.query,
    );
    const objectToCompareIdAllInstance = plainToClass(
      QueryParamsIdAllTodoEndpointBody,
      req.query,
    );
    try {
      const queryBody = req.query;
      if (queryBody.id !== 'all') {
        await validateOrReject(objectToCompareIdNumInstance, {
          whitelist: true,
          forbidNonWhitelisted: true,
        });
        next();
      } else {
        await validateOrReject(objectToCompareIdAllInstance, {
          whitelist: true,
          forbidNonWhitelisted: true,
        });
        next();
      }
    } catch (err) {
      const errObject = {};
      err.forEach((n) => (errObject[n.property] = n.constraints));
      this.errorHander.reportError(errObject, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}

@Injectable()
export class ValidateIdRelationships implements NestMiddleware {
  constructor(
    private readonly errorHander: CustomerErrorHandler,
    private readonly jwt: JwtProvider,
    private readonly prisma: CustomerPrismaProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      this.jwt.validateJwtToken(req.headers.authorization);
      const id = this.jwt.getDecodedJwtToken().id;
      const isCustomerValidCustomer = await this.prisma.getCustomerById(
        Number(req.query.cid),
        id,
      );
      if (isCustomerValidCustomer === null) {
        this.errorHander.reportError(
          'Customer Does Not Exist.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      if (req.query.id === 'all') {
        next();
      } else {
        const isTodoValidTodo = await this.prisma.getTodoById(
          Number(req.query.id),
          Number(req.query.cid),
          id,
        );
        if (isTodoValidTodo !== null) {
          next();
        } else {
          this.errorHander.reportError(
            'Todo Does Not Exist.',
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }
      }
    } catch (err) {
      const message =
        err?.inner?.message || err.message || 'An Unexpected Problem Occurred.';
      const status = err?.inner?.mesage
        ? HttpStatus.UNAUTHORIZED
        : err.status || HttpStatus.INTERNAL_SERVER_ERROR;
      this.errorHander.reportError(message, status);
    }
  }
}
