import { plainToClass } from 'class-transformer';
import * as validator from 'validator';
import { validateOrReject } from 'class-validator';
import { CreateProjectBody } from '../dtos/CreateProjectBody';
import { NextFunction, Request, Response } from 'express';
import { ProjectErrorHandler } from '../providers/error';
import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { JwtProvider } from '../providers/jwt';
import { ProjectPrismaProvider } from '../providers/prisma';
import { CreateProjectExpenseBody } from '../dtos/CreateProjectExpense';

@Injectable()
export class ValidateExpenseBody implements NestMiddleware {
  constructor(private readonly errorHandler: ProjectErrorHandler) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const objectToCompare = plainToClass(CreateProjectExpenseBody, req.body);
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
export class SanitizeExpense implements NestMiddleware {
  private readonly validate = validator;
  constructor(private readonly errorHandler: ProjectErrorHandler) {}
  use(req: Request, res: Response, next: NextFunction) {
    try {
      const keys: string[] = ['expense_description'];
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
export class ValidateProjectIds implements NestMiddleware {
  constructor(
    private readonly errorHandler: ProjectErrorHandler,
    private readonly jwt: JwtProvider,
    private readonly prisma: ProjectPrismaProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const isValidProject = await this.prisma.findProjectWithId(
        req.body.project_id,
      );
      if (isValidProject === null) {
        this.errorHandler.reportError(
          'Project Does Not Exist.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      } else {
        const { customer_id, user_id } = isValidProject;
        this.jwt.validateJwtToken(req.headers.authorization);
        const id = this.jwt.getDecodedJwtToken().id;
        if (id !== user_id) {
          this.errorHandler.reportError(
            'Unauthorized.',
            HttpStatus.UNAUTHORIZED,
          );
        } else {
          const isValidCustomer = await this.prisma.getCustomerById(
            customer_id,
            user_id,
          );
          if (isValidCustomer === null) {
            this.errorHandler.reportError(
              'Customer Does Not Exist Related To This Project.',
              HttpStatus.UNPROCESSABLE_ENTITY,
            );
          }
          next();
        }
      }
    } catch (err) {
      this.errorHandler.reportError(
        err?.inner?.message || err.message || 'An Unexpected Problem Occurred.',
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
