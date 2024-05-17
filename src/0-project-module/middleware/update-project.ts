import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import { ProjectErrorHandler } from '../providers/error';
import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { JwtProvider } from '../providers/jwt';
import { ProjectPrismaProvider } from '../providers/prisma';
import { UpdatedProjectBody } from '../dtos/UpdateProjectBody';

@Injectable()
export class ValidateUpdatedProjectBody implements NestMiddleware {
  constructor(private readonly errorHandler: ProjectErrorHandler) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const objectToCompare = plainToClass(UpdatedProjectBody, req.body);
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
export class ValidateProjectWithIdInRelationToCustomerAndUserExists
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
      const body: UpdatedProjectBody = req.body;
      const result = await this.prisma.validateProjectWithIdExists(
        body.id,
        id,
        body.customer_id,
      );
      if (result === null) {
        this.errorHandler.reportError(
          'Project Does Not Exist.',
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

@Injectable()
export class ValidateProjectIsUniqueForUpdatedProject
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
      const customer_id = req.body.customer_id;
      const result = await this.prisma.validateProjectIsUniqueBesidesSelf(
        id,
        customer_id,
        req.body.project_title,
        new Date(req.body.estimated_end_date),
        req.body.id,
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
