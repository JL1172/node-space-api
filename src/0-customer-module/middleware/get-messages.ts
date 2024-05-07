import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { CustomerErrorHandler } from '../providers/error';
import { NextFunction, Request, Response } from 'express';
import { plainToClass } from 'class-transformer';
import { ParamBody, QueryBody } from '../dtos/ViewMessagesBodies';
import { validateOrReject } from 'class-validator';
import { CustomerPrismaProvider } from '../providers/prisma';
import { Customer } from '@prisma/client';
import { JwtProvider } from '../providers/jwt';

@Injectable()
export class ValidateParamBody implements NestMiddleware {
  constructor(private readonly errorHandler: CustomerErrorHandler) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const objectToCompare = plainToClass(ParamBody, req.params);
    try {
      await validateOrReject(objectToCompare, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      next();
    } catch (err) {
      const errObject = {};
      err.forEach((n) => (errObject[n.property] = n.constraints));
      this.errorHandler.reportError(errObject, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}

@Injectable()
export class SetDefaultQueryParams implements NestMiddleware {
  constructor(private readonly errorHandler: CustomerErrorHandler) {}
  use(req: Request, res: Response, next: NextFunction) {
    try {
      // const query = req.query;
      // if (Object.keys(query).length !== 4) {
      const {
        limit = '10',
        page = '1',
        sortBy = 'created_at',
        sortDir = 'asc',
      } = req.query;
      const defaultQueryParams = {
        limit,
        page,
        sortBy,
        sortDir,
      };
      req.query = defaultQueryParams;
      // }
      next();
    } catch (err) {
      this.errorHandler.reportError(
        'An Unexpected Problem Occurred. If Problem Persists, Contact Node Space.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

@Injectable()
export class ValidateQueryBody implements NestMiddleware {
  constructor(private readonly errorHandler: CustomerErrorHandler) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const objectToCompare = plainToClass(QueryBody, req.query);
    try {
      await validateOrReject(objectToCompare, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      next();
    } catch (err) {
      const errObject = {};
      err.forEach((n) => (errObject[n.property] = n.constraints));
      this.errorHandler.reportError(errObject, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}

@Injectable()
export class ValidateCustomerWithIdRelatedToUserExists
  implements NestMiddleware
{
  constructor(
    private readonly errorHandler: CustomerErrorHandler,
    private readonly prisma: CustomerPrismaProvider,
    private readonly jwt: JwtProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      this.jwt.validateJwtToken(req.headers.authorization);
      const id = this.jwt.getDecodedJwtToken().id;
      const isCustomerValid: Customer = await this.prisma.getCustomerById(
        Number(req.params.id),
        id,
      );
      if (!isCustomerValid) {
        this.errorHandler.reportError(
          'Customer Does Not Exist.',
          HttpStatus.BAD_REQUEST,
        );
      }
      next();
    } catch (err) {
      this.errorHandler.reportError(
        err?.inner?.message ||
          err?.message ||
          'An Unexpected Problem Occurred.',
        err?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
