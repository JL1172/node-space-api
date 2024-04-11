import { Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import 'dotenv/config';
@Injectable()
export class JwtProvider {
  private jwtToken: string;
  private readonly jwt = jwt;
  private setJwtToken(token: string): void {
    this.jwtToken = token;
  }
  public createJwtToken(user: User): void {
    try {
      const payload = {
        username: user.username,
        email: user.email,
        full_name: user.first_name + user.last_name,
      };
      const options = {
        expiresIn: '1d',
      };
      console.log(process.env.JWT_SECRET);
      const signedJwt = this.jwt.sign(
        payload,
        String(process.env.JWT_SECRET),
        options,
      );
      this.setJwtToken(signedJwt);
    } catch (err) {
      console.log(err);
    }
  }
  public getJwtToken(): string {
    return this.jwtToken;
  }
}
