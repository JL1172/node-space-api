import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptProvider {
  private readonly bcrypt: typeof bcrypt = bcrypt;
  public hashPassword(receivedPassword: string): string {
    return this.bcrypt.hashSync(
      receivedPassword,
      Number(process.env.SALT_ROUNDS),
    );
  }
}
