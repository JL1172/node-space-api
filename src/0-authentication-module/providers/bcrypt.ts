import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
@Injectable()
export class BcryptProvider {
  private readonly bcrypt: typeof bcrypt = bcrypt;
  private packageError(error: string): void {
    throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
  public async hashPassword(password: string): Promise<string> {
    try {
      const hashedPassword: string = this.bcrypt.hashSync(
        password,
        Number(process.env.SALT_ROUNDS),
      );
      if (!hashedPassword) {
        this.packageError('An Unexpected Problem Occurred.');
      }
      return hashedPassword;
    } catch (err) {
      this.packageError('An Unexpected Problem Occurred');
    }
  }
  public async comparePassword(
    receivedPassword: string,
    expectedPassword: string,
  ): Promise<boolean> {
    try {
      return this.bcrypt.compareSync(receivedPassword, expectedPassword);
    } catch (err) {
      this.packageError('An Unexpted Problem Occurred.');
    }
  }
}
