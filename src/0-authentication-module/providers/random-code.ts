import { Injectable } from '@nestjs/common';

@Injectable()
export class RandomCodeGenerator {
  private readonly length: number = 6;
  private readonly expirationDate: Date;
  private readonly letterList: string =
    'ABCDEFGHJKMNOPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789';
  constructor() {
    const currentTime = new Date();
    this.expirationDate = new Date(currentTime.getTime() + 5 * 1000 * 60);
  }
  public isExpired(): boolean {
    const currentTime = new Date();
    return currentTime.getTime() > this.expirationDate.getTime();
  }
  public generateCode(): string {
    let result: string = '';
    const letterListLength = this.letterList.length;
    for (let i: number = 0; i < this.length; i++) {
      result += this.letterList.charAt(
        Math.floor(Math.random() * letterListLength),
      );
    }
    return result;
  }
  public getExpirationDate(): Date {
    return this.expirationDate;
  }
}
