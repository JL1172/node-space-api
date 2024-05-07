import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { CustomerErrorHandler } from '../providers/error';
import { plainToClass } from 'class-transformer';
import { QueryParamsBody2 } from '../dtos/ViewCustomerBodies';
import { validateOrReject } from 'class-validator';
import { CustomerPrismaProvider } from '../providers/prisma';
import { JwtProvider } from '../providers/jwt';
import { Customer } from '@prisma/client';

@Injectable()
export class ValidateQueryParameters implements NestMiddleware {
  constructor(private readonly errorHandler: CustomerErrorHandler) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const objectToCompare = plainToClass(QueryParamsBody2, req.query);
    try {
      if (req.query.id) {
        await validateOrReject(objectToCompare, {
          whitelist: true,
          forbidNonWhitelisted: true,
        });
        next();
      } else {
        next();
      }
    } catch (err) {
      const errObject = {};
      err.forEach((n) => (errObject[n.property] = n.constraints));
      this.errorHandler.reportError(errObject, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}

@Injectable()
export class ValidateCustomerExists implements NestMiddleware {
  constructor(
    private readonly errorHandler: CustomerErrorHandler,
    private readonly prisma: CustomerPrismaProvider,
    private readonly jwt: JwtProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      //this is if query id is default
      if (req.query.id) {
        this.jwt.validateJwtToken(req.headers.authorization);
        const id = this.jwt.getDecodedJwtToken().id;
        const isCustomerValid: Customer = await this.prisma.getCustomerById(
          Number(req.query.id),
          id,
        );
        if (!isCustomerValid) {
          this.errorHandler.reportError(
            'Customer Does Not Exist.',
            HttpStatus.BAD_REQUEST,
          );
        }
        next();
      } else {
        next();
      }
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
