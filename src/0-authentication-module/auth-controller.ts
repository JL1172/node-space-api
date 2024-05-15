import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { RegistrationBody } from './dtos/RegistrationBody';
import { User } from '@prisma/client';
import { BcryptProvider } from './providers/bcrypt';
import { JWT_ROLE, JwtProvider } from './providers/jwt';
import { UserClass } from './providers/login';
import { AuthenticationErrorHandler } from './providers/error';
import { ResetPasswordBody } from './dtos/ResetPasswordBody';
import { AuthenticationPrismaProvider } from './providers/prisma';
import { EmailMarkup, Mailer } from './providers/email';
import { RandomCodeGenerator } from './providers/random-code';

@Controller('/api/auth')
export class AuthenticationController {
  constructor(
    private readonly prisma: AuthenticationPrismaProvider,
    private readonly bcrypt: BcryptProvider,
    private readonly jwt: JwtProvider,
    private readonly user: UserClass,
    private readonly errorHandler: AuthenticationErrorHandler,
    private readonly generateVerificationCode: RandomCodeGenerator,
    private readonly mailer: Mailer,
  ) {}
  @Post('/registration')
  public async register(@Body() body: RegistrationBody): Promise<string> {
    try {
      body.password = await this.bcrypt.hashPassword(body.password);
      await this.prisma.createNewUser(body);
      const email: string = body.email;
      const random6DigitCode = this.generateVerificationCode.generateCode();
      await this.mailer.draftEmail(
        email,
        'Email Verification.',
        EmailMarkup.VERIFY_EMAIL,
        random6DigitCode,
      );
      await this.prisma.storeVerificationCode({
        user_email: email,
        expiration_date: this.generateVerificationCode.getExpirationDate(),
        verification_code: random6DigitCode,
        code_type: EmailMarkup.VERIFY_EMAIL,
      });
      return 'New Account Successfully Created. Check Email For Verification Code.';
    } catch (err) {
      console.log(err);
      this.errorHandler.reportHttpError(
        'An Unexpected Problem Occurred.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Post('/generate-verification-code')
  public generateVerificationCodeForEmail() {
    try {
      return 'Check Your Inbox For Your Verification Code.';
    } catch (err) {
      this.errorHandler.reportHttpError(
        'An Unexpected Problem Occurred.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Post('/verify-email')
  public async verifyEmail(@Body() body: User): Promise<string> {
    try {
      const userToInsert = await this.prisma.getUserByEmail(body.email);
      userToInsert.email_verified = true;
      await this.prisma.updateUserWithId(userToInsert.id, userToInsert);
      return 'Successfully Verified Email.';
    } catch (err) {
      this.errorHandler.reportHttpError(
        'An Unexpected Problem Occurred.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Post('/login')
  @HttpCode(200)
  public login(): { token: string } {
    this.jwt.createJwtToken(this.user.getUser());
    return { token: this.jwt.getJwtToken() };
  }
  @Post('/change-password')
  public changePassword(): string {
    try {
      return 'Check Your Inbox For Your Verification Code.';
    } catch (err) {
      this.errorHandler.reportHttpError(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  @Post('/verify-code')
  public async verifyCode(
    @Body() body: User,
  ): Promise<{ token: string; message: string }> {
    try {
      const userToInsert = await this.prisma.getUserByEmail(body.email);
      this.jwt.createJwtToken(userToInsert, 5 * 60, JWT_ROLE.RESET_PASSWORD);
      const jwt = this.jwt.getJwtToken();
      return { token: jwt, message: 'Success, 5 Minutes To Change Password.' };
    } catch (err) {
      this.errorHandler.reportHttpError(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  @Post('/reset-password')
  public async resetPassword(@Body() body: ResetPasswordBody): Promise<string> {
    try {
      //grab decoded token
      const decodedToken = this.jwt.getDecodedJwtToken();
      //grab the token
      const token = this.jwt.getJwtToken();
      //find user with id
      const user = await this.prisma.getUserWithId(decodedToken.id);
      //update password
      const hashed = await this.bcrypt.hashPassword(body.password);
      user.password = hashed;
      //create object for token creation
      const tokenToInsertIntoDb = {
        token,
        expiration_time: new Date(decodedToken.exp * 1000),
      };
      //create new token
      await this.prisma.createNewJwtToken(tokenToInsertIntoDb);
      //update user's password
      await this.prisma.updateUserWithId(decodedToken.id, user);
      //delete values
      this.jwt.destroy();
      return 'Password Successfully Updated.';
    } catch (err) {
      this.errorHandler.reportHttpError(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  @Get('/logout')
  public async logout(@Headers() headers): Promise<string> {
    const tokenToInsertIntoDb: { token: string; expiration_time: Date } = {
      token: headers.authorization,
      expiration_time: new Date(this.jwt.getDecodedJwtToken().exp * 1000),
    };
    await this.prisma.createNewJwtToken(tokenToInsertIntoDb);
    return 'Successfully Logged Out.';
  }
  @Get('/restricted')
  public restrictedRoute(): { authorized: boolean } {
    return { authorized: true };
  }
}
