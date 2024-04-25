import { Controller, Get } from '@nestjs/common';

@Controller('/api/customer')
export class CustomerController {
  @Get('/')
  public sanity() {
    return 'hello world';
  }
}
