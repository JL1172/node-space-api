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
import * as validator from 'validator';

@Injectable()
export class ValidateDraftMessageBody implements NestInterceptor {
  constructor(private readonly errorHandler: CustomerErrorHandler) {}
  async intercept(context: ExecutionContext, next: CallHandler<any>) {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const objectToCompare = plainToClass(DraftedMessageBody, req.body);
    try {
      await validateOrReject(objectToCompare, {
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

@Injectable()
export class SanitizeDraftMessageBody implements NestInterceptor {
  private readonly validate = validator;
  constructor(private readonly errorHandler: CustomerErrorHandler) {}
  intercept(context: ExecutionContext, next: CallHandler<any>) {
    try {
      const ctx = context.switchToHttp();
      const req = ctx.getRequest<Request>();
      const body: DraftedMessageBody = req.body;
      const keys: string[] = [
        'message_subject',
        'message_text',
        'message_sender_id',
        'message_recipient_id',
      ];
      const n = keys.length;
      for (let i: number = 0; i < n; i++) {
        body[keys[i]] = this.validate.trim(body[keys[i]]);
        body[keys[i]] = this.validate.escape(body[keys[i]]);
        body[keys[i]] = this.validate.blacklist(
          body[keys[i]],
          /[\x00-\x1F\s;'"\\<>]/.source,
        );
      }
      return next.handle();
    } catch (err) {
      this.errorHandler.reportError(
        'An Unexpected Problem Occurred While Trying To Parse The Email Content.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
