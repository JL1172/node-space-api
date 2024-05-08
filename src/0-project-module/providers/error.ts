import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class ProjectErrorHandler {
  public reportError(
    err: string | Record<string, any>,
    status: HttpStatus,
  ): void {
    throw new HttpException(err, status);
  }
}
