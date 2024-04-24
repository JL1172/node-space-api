import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

@Injectable()
export class UserClass {
  private user: User;
  public setUser(newUser: User): void {
    this.user = newUser;
  }
  public getUser(): User {
    return this.user;
  }
}
