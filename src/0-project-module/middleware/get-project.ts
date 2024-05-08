import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { ProjectErrorHandler } from '../providers/error';
import { NextFunction, Request, Response } from 'express';
import {
  CompletedEnum,
  SortByTodoEnum,
} from 'src/0-customer-module/dtos/GetCustomerTodoBodies';
import { plainToClass } from 'class-transformer';
import {
  AllProjectsOfEveryCustomer,
  AllProjectsOfOneCustomer,
  OneProjectForOneCustomer,
} from '../dtos/ViewProjectBody';
import { validateOrReject } from 'class-validator';
import { ProjectPrismaProvider } from '../providers/prisma';
import { JwtProvider } from '../providers/jwt';

@Injectable()
export class SetDefaultQueryParams implements NestMiddleware {
  constructor(private readonly errorHandler: ProjectErrorHandler) {}
  use(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        limit = '10',
        page = '1',
        sortBy = SortByTodoEnum.URGENT,
        complete = CompletedEnum.FALSE,
        pid = 'all',
        cid = 'all',
      } = req.query;
      req.query = { limit, page, sortBy, complete, pid, cid };
      next();
    } catch (err) {
      this.errorHandler.reportError(
        'An Unexpected Error Occurred.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

@Injectable()
export class ValidateQueryParams implements NestMiddleware {
  constructor(private readonly errorHandler: ProjectErrorHandler) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const allProjectOfOneCustomer = plainToClass(
      AllProjectsOfOneCustomer,
      req.query,
    );
    const allProjectsOfEveryCustomer = plainToClass(
      AllProjectsOfEveryCustomer,
      req.query,
    );
    const oneProjectForOneCustomer = plainToClass(
      OneProjectForOneCustomer,
      req.query,
    );
    try {
      const query = req.query;
      if (query.cid !== 'all' && query.pid === 'all') {
        await validateOrReject(allProjectOfOneCustomer, {
          whitelist: true,
          forbidNonWhitelisted: true,
        });
        next();
      } else if (query.cid === 'all' && query.pid === 'all') {
        await validateOrReject(allProjectsOfEveryCustomer, {
          whitelist: true,
          forbidNonWhitelisted: true,
        });
        next();
      } else if (query.cid !== 'all' && query.pid !== 'all') {
        await validateOrReject(oneProjectForOneCustomer, {
          whitelist: true,
          forbidNonWhitelisted: true,
        });
        next();
      } else if (query.pid !== 'all' && query.cid === 'all') {
        this.errorHandler.reportError(
          'An Unexpected Error Occurred.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (err) {
      if (err.message === 'An Unexpected Error Occurred.') {
        this.errorHandler.reportError(
          'An Unexpected Error Occurred.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      const errObject = {};
      err.forEach((n) => (errObject[n.property] = n.constraints));
      this.errorHandler.reportError(errObject, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}

@Injectable()
export class ValidateCustomerWithIdExistsQueryParam implements NestMiddleware {
  constructor(
    private readonly errorHandler: ProjectErrorHandler,
    private readonly jwt: JwtProvider,
    private readonly prisma: ProjectPrismaProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.query.cid === 'all') {
        next();
      } else {
        this.jwt.validateJwtToken(req.headers.authorization);
        const id = this.jwt.getDecodedJwtToken().id;
        const customer_id = req.query.cid;
        const result = await this.prisma.getCustomerById(
          Number(customer_id),
          id,
        );
        if (result === null) {
          this.errorHandler.reportError(
            'Customer Does Not Exist.',
            HttpStatus.BAD_REQUEST,
          );
        } else {
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

@Injectable()
export class ValidateProjectExists implements NestMiddleware {
  constructor(
    private readonly errorHandler: ProjectErrorHandler,
    private readonly jwt: JwtProvider,
    private readonly prisma: ProjectPrismaProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.query.cid === 'all' && req.query.pid === 'all') {
        next();
      } else if (req.query.cid !== 'all' && req.query.pid !== 'all') {
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
          next();
        }
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
