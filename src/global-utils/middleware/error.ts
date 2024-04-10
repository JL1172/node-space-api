import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class ErrorMiddleware implements ExceptionFilter {
  private readonly logger = new Logger(ErrorMiddleware.name);
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const error_message = exception.getResponse();
    const error_type = exception.message;
    const { path, method } = req;
    this.logger.error(
      JSON.stringify({
        error_type,
        path,
        method,
        timestamp: new Date().toISOString(),
        error_message,
      }),
    );
    res
      .status(exception.getStatus())
      .json({ error_message, error_type, path, method });
  }
}
