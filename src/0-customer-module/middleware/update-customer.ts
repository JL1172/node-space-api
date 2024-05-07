import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { CustomerErrorHandler } from '../providers/error';
import { CustomerPrismaProvider } from '../providers/prisma';
import { NextFunction, Request, Response } from 'express';
import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { UpdatedCustomerBody } from '../dtos/UpdatedCustomerBody';
import { JwtProvider } from '../providers/jwt';

@Injectable()
export class ValidateUpdatedCustomerBody implements NestMiddleware {
  constructor(private readonly errorHandler: CustomerErrorHandler) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const objectToCompare = plainToClass(UpdatedCustomerBody, req.body);
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
export class ValidateUpdatedCustomerExists implements NestMiddleware {
  constructor(
    private readonly errorHandler: CustomerErrorHandler,
    private readonly jwt: JwtProvider,
    private readonly prisma: CustomerPrismaProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      this.jwt.validateJwtToken(req.headers.authorization);
      const id = this.jwt.getDecodedJwtToken().id;
      const customer_id = req.body.id;
      const result = await this.prisma.getCustomerById(customer_id, id);
      if (!result) {
        this.errorHandler.reportError(
          'Customer Does Not Exist.',
          HttpStatus.BAD_REQUEST,
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

@Injectable()
//this excludes the current version of this customer
export class ValidateCustomerIsUnique implements NestMiddleware {
  constructor(
    private readonly errorHandler: CustomerErrorHandler,
    private readonly prisma: CustomerPrismaProvider,
    private readonly jwt: JwtProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      this.jwt.validateJwtToken(req.headers.authorization);
      const id = this.jwt.getDecodedJwtToken().id;
      const result = await this.prisma.verifyUpdatedCustomerIsUnique(
        req.body.id,
        id,
        req.body,
      );
      if (!result) {
        this.errorHandler.reportError(
          'Error Updating Customer, Customer With One Of The Following Already Exists: email, phone number, address, full name.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      } else {
        next();
      }
    } catch (err) {
      this.errorHandler.reportError(
        err?.inner?.message || err.message || 'An Unexpected Problem Occurred.',
        err?.inner?.message
          ? HttpStatus.UNAUTHORIZED
          : err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
