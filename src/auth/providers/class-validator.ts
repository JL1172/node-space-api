import { Injectable } from '@nestjs/common';
import * as validator from 'class-validator';

@Injectable()
export class ClassValidator {
  private readonly validator: typeof validator = validator;
  public validate(): void {
    console.log(
      'this needs to be wired up in /src/auth/providers/class-validator.ts',
    );
  }
}
