import { Injectable } from '@nestjs/common';

@Injectable()
export class UserEmailStorage {
  private userEmail: string;
  public setUserEmail(email: string): void {
    this.userEmail = email;
  }
  public getUserEmail(): string {
    return this.userEmail;
  }
}
