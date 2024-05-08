import { plainToClass } from 'class-transformer';
import * as validator from 'validator';
import { validateOrReject } from 'class-validator';
import { CreateProjectBody } from '../dtos/CreateProjectBody';
import { NextFunction, Request, Response } from 'express';
import { ProjectErrorHandler } from '../providers/error';
import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { JwtProvider } from '../providers/jwt';
import { ProjectPrismaProvider } from '../providers/prisma';

@Injectable()
export class ValidateNewProjectBody implements NestMiddleware {
  constructor(private readonly errorHandler: ProjectErrorHandler) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const objectToCompare = plainToClass(CreateProjectBody, req.body);
    try {
      await validateOrReject(objectToCompare, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      next();
    } catch (err) {
      const errObj = {};
      console.log(errObj);
      err.forEach((n) => (errObj[n.property] = n.constraints));
      this.errorHandler.reportError(errObj, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}

@Injectable()
export class SanitizeNewProjectBody implements NestMiddleware {
  private readonly validate = validator;
  constructor(private readonly errorHandler: ProjectErrorHandler) {}
  use(req: Request, res: Response, next: NextFunction) {
    try {
      const keys: string[] = ['project_title', 'project_description'];
      const body: CreateProjectBody = req.body;
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
export class ValidateDateIsValid implements NestMiddleware {
  constructor(
    private readonly errorHandler: ProjectErrorHandler,
    private readonly jwt: JwtProvider,
    private readonly prisma: ProjectPrismaProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const currentDate = new Date();
      if (new Date(req.body.estimated_end_date) < currentDate) {
        this.errorHandler.reportError(
          'Estimated End Date Must Be Greater Than Current Date.',
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
export class ValidateCustomerWithIdExists implements NestMiddleware {
  constructor(
    private readonly errorHandler: ProjectErrorHandler,
    private readonly jwt: JwtProvider,
    private readonly prisma: ProjectPrismaProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      this.jwt.validateJwtToken(req.headers.authorization);
      const id = this.jwt.getDecodedJwtToken().id;
      const customer_id = req.body.customer_id;
      const result = await this.prisma.getCustomerById(customer_id, id);
      if (result === null) {
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

@Injectable()
export class ValidateProjectIsUnique implements NestMiddleware {
  constructor(
    private readonly errorHandler: ProjectErrorHandler,
    private readonly jwt: JwtProvider,
    private readonly prisma: ProjectPrismaProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      this.jwt.validateJwtToken(req.headers.authorization);
      const id = this.jwt.getDecodedJwtToken().id;
      const customer_id = req.body.customer_id;
      const result = await this.prisma.validateProjectIsUnique(
        id,
        customer_id,
        req.body.project_title,
        new Date(req.body.estimated_end_date),
      );
      if (result !== null) {
        this.errorHandler.reportError(
          'Project With Relation To User, Customer, With The Same Title And Estimated End Date Already Exists.',
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
