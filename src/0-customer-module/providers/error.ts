import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class CustomerErrorHandler {
  public reportError(
    err: string | Record<string, any>,
    status: HttpStatus,
  ): void {
    throw new HttpException(err, status);
  }
}
