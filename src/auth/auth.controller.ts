import { Controller, Post } from '@nestjs/common';

@Controller('/api/auth')
export class AuthenticationController {
  @Post('/registration')
  public registerUser(): string {
    return 'hello world';
  }
}
