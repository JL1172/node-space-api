import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ProjectErrorHandler } from '../providers/error';
import { plainToClass } from 'class-transformer';
import {
  ViewProjectExpenseBody,
  ViewProjectExpenseBodyAll,
} from '../dtos/ViewProjectExpenseBody';
import { validateOrReject } from 'class-validator';
import { JwtProvider } from '../providers/jwt';
import { ProjectPrismaProvider } from '../providers/prisma';

@Injectable()
export class SetDefaultProjectExpenseParams implements NestMiddleware {
  constructor(private readonly errorHandler: ProjectErrorHandler) {}
  use(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        limit = '10',
        page = '1',
        sortBy = 'created_at',
        orderBy = 'asc',
        eid = 'all',
        pid,
      } = req.query;
      req.query = { limit, page, sortBy, orderBy, eid, pid };
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
export class ValidateProjectExpenseParams implements NestMiddleware {
  constructor(private readonly errorHandler: ProjectErrorHandler) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const notAll = plainToClass(ViewProjectExpenseBody, req.query);
    const all = plainToClass(ViewProjectExpenseBodyAll, req.query);
    try {
      if (req.query.eid === 'all') {
        await validateOrReject(all, {
          whitelist: true,
          forbidNonWhitelisted: true,
        });
        next();
      } else {
        await validateOrReject(notAll, {
          whitelist: true,
          forbidNonWhitelisted: true,
        });
        next();
      }
    } catch (err) {
      const errObj = {};
      err.forEach((n) => (errObj[n.property] = n.constraints));
      this.errorHandler.reportError(errObj, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}

@Injectable()
export class ValidateProjectIdsViewProject implements NestMiddleware {
  constructor(
    private readonly errorHandler: ProjectErrorHandler,
    private readonly jwt: JwtProvider,
    private readonly prisma: ProjectPrismaProvider,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const isValidProject = await this.prisma.findProjectWithId(
        Number(req.query.pid),
      );
      if (isValidProject === null) {
        this.errorHandler.reportError(
          'Project Does Not Exist.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      if (req.query.eid === 'all') {
        next();
      } else {
        const isValidExpense = await this.prisma.findExpenseWithId(
          Number(req.query.eid),
        );
        if (isValidExpense === null) {
          this.errorHandler.reportError(
            'Expense Does Not Exist.',
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }
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
