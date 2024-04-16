import { HttpStatus, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import 'dotenv/config';
import { AuthenticationErrorHandler } from './error';

export enum JWT_ROLE {
  LOGIN = 'LOGIN',
  RESET_PASSWORD = 'RESET_PASSWORD',
}

@Injectable()
export class JwtProvider {
  private jwtToken: string;
  private readonly jwt = jwt;
  constructor(private readonly errorHandler: AuthenticationErrorHandler) {}
  private setJwtToken(token: string): void {
    this.jwtToken = token;
  }
  public createJwtToken(
    user: User,
    expiration: string | number = '1d',
    jwt_role: JWT_ROLE = JWT_ROLE.LOGIN,
  ): void {
    try {
      const payload: {
        id: number;
        jwt_role: JWT_ROLE;
        username: string;
        email: string;
        full_name: string;
      } = {
        id: user.id,
        username: user.username,
        email: user.email,
        jwt_role: jwt_role,
        full_name: user.first_name + user.last_name,
      };
      const options: { expiresIn: string | number } = {
        expiresIn: expiration,
      };
      const signedJwt = this.jwt.sign(
        payload,
        String(process.env.JWT_SECRET),
        options,
      );
      this.setJwtToken(signedJwt);
    } catch (err) {
      this.errorHandler.reportHttpError(
        'An Unexpected Problem Occurred.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  public getJwtToken(): string {
    return this.jwtToken;
  }
}
