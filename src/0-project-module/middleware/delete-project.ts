import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { ProjectErrorHandler } from '../providers/error';
import { NextFunction, Request, Response } from 'express';
import { plainToClass } from 'class-transformer';
import { DeleteProjectBody } from '../dtos/DeleteProjectBody';
import { validateOrReject } from 'class-validator';
import { JwtProvider } from '../providers/jwt';
import { ProjectPrismaProvider } from '../providers/prisma';

@Injectable()
export class ValidatDeleteProjectBody implements NestMiddleware {
  constructor(private readonly errorHandler: ProjectErrorHandler) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const objectToCompare = plainToClass(DeleteProjectBody, req.query);
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
export class ValidateCustomerWithIdExistsDeleteProject
  implements NestMiddleware
{
  constructor(
    private readonly errorHandler: ProjectErrorHandler,
    private readonly jwt: JwtProvider,
    private readonly prisma: ProjectPrismaProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      this.jwt.validateJwtToken(req.headers.authorization);
      const id = this.jwt.getDecodedJwtToken().id;
      const customer_id = req.query.cid;
      const result = await this.prisma.getCustomerById(Number(customer_id), id);
      if (result === null) {
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
export class ValidateProjectExistsDeleteProject implements NestMiddleware {
  constructor(
    private readonly errorHandler: ProjectErrorHandler,
    private readonly jwt: JwtProvider,
    private readonly prisma: ProjectPrismaProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      this.jwt.validateJwtToken(req.headers.authorization);
      const id = this.jwt.getDecodedJwtToken().id;
      const customer_id = req.query.cid;
      const project_id = req.query.pid;
      const result = await this.prisma.validateProjectWithIdExists(
        Number(project_id),
        id,
        Number(customer_id),
      );
      if (result === null) {
        this.errorHandler.reportError(
          'Project Does Not Exist.',
          HttpStatus.BAD_REQUEST,
        );
      } else {
        req.query.uid = id + '';
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
