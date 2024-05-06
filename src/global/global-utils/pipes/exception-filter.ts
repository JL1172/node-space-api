import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalErrorMiddleware implements ExceptionFilter {
  private readonly logger = new Logger(GlobalErrorMiddleware.name);
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.status;
    const exception_type = exception.name;
    const message =
      exception?.getResponse() || 'An Unexpected Problem Occurred';
    const timestamp = new Date().toISOString();
    const { baseUrl, method } = request;
    this.logger.error(
      JSON.stringify({
        status,
        baseUrl,
        method,
        exception_type,
        timestamp,
        message,
      }),
    );
    response
      .status(status)
      .json({ status, baseUrl, method, exception_type, message, timestamp });
  }
}
