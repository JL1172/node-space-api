import { HttpStatus, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import 'dotenv/config';
import { CustomerErrorHandler } from './error';

export enum JWT_ROLE {
  LOGIN = 'LOGIN',
  RESET_PASSWORD = 'RESET_PASSWORD',
  AUTHORIZATION = 'AUTHORIZATION',
}

export class decodedTokenDto {
  id: number;
  username: string;
  email: string;
  jwt_role: JWT_ROLE;
  full_name: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtProvider {
  private jwtToken: string;
  private readonly jwt = jwt;
  private decodedJwt: decodedTokenDto;
  constructor(private readonly errorHandler: CustomerErrorHandler) {}
  private setJwtToken(token: string): void {
    this.jwtToken = token;
  }
  private setDecodedJwtToken(decodedToken) {
    this.decodedJwt = decodedToken;
  }
  public getDecodedJwtToken(): decodedTokenDto {
    return this.decodedJwt;
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
      this.errorHandler.reportError(
        'An Unexpected Problem Occurred.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  public getJwtToken(): string {
    return this.jwtToken;
  }
  public validateJwtToken(token: string): boolean {
    this.jwt.verify(
      token,
      process.env.JWT_SECRET,
      (err, decodedToken: decodedTokenDto) => {
        if (err) {
          throw new this.jwt.JsonWebTokenError('Error:', err);
        } else {
          this.setDecodedJwtToken(decodedToken);
        }
      },
    );
    return true;
  }
  public destroy(): void {
    this.jwtToken = null;
    this.decodedJwt = null;
  }
}
