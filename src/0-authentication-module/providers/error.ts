import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class AuthenticationErrorHandler {
  public reportHttpError(
    errorMessage: string | Record<string, any>,
    status: HttpStatus,
  ): void {
    throw new HttpException(errorMessage, status);
  }
}
