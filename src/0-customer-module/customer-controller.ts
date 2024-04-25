import { Controller, Post } from '@nestjs/common';

@Controller('/api/customer')
export class CustomerController {
  @Post('/create-new-customer')
  public createNewCustomer(): string {
    return 'hello world';
  }
}
