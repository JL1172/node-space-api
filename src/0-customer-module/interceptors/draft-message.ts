import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { CustomerErrorHandler } from '../providers/error';
import { plainToClass } from 'class-transformer';
import { DraftedMessageBody } from '../dtos/DraftedMessageBody';
import { validateOrReject } from 'class-validator';

@Injectable()
export class ValidateDraftMessageBody implements NestInterceptor {
  constructor(private readonly errorHandler: CustomerErrorHandler) {}
  async intercept(context: ExecutionContext, next: CallHandler<any>) {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const objectToCOmpare = plainToClass(DraftedMessageBody, req.body);
    try {
      await validateOrReject(objectToCOmpare, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      return next.handle();
    } catch (err) {
      const errObject = {};
      err.forEach((n) => (errObject[n.property] = n.constraints));
      this.errorHandler.reportError(errObject, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}
