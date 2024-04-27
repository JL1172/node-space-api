import { Body, Controller, Post } from '@nestjs/common';
import { CustomerPrismaProvider } from './providers/prisma';
import {
  NewCustomerBody,
  NewCustomerBodyToInsertIntoDb,
} from './dtos/NewCustomerBody';
import { JwtProvider } from './providers/jwt';

@Controller('/api/customer')
export class CustomerController {
  constructor(
    private readonly prisma: CustomerPrismaProvider,
    private readonly jwt: JwtProvider,
  ) {}
  @Post('/create-new-customer')
  public async createNewCustomer(
    @Body() body: NewCustomerBody,
  ): Promise<string> {
    const user_id: number = this.jwt.getDecodedJwtToken().id;
    const newCustomer: NewCustomerBodyToInsertIntoDb = { ...body, user_id };
    await this.prisma.createNewCustomer(newCustomer);
    return 'Successfully Created Customer.';
  }
  //draft message to customer
  @Post('/draft-message-to-customer')
  public async draftMessageToCustomer(): Promise<string> {
    //just return the preview of the message
    return 'Successfully Messaged Customer.';
  }
  //send drafted message to ai in order to get enhanced message
  @Post('/ai-message-recommendation')
  public async getAiRecommendation(): Promise<string> {
    //return the preview of the ai message and the original
    return 'Here is your message and the ai recommended message.';
  }
  //validate and sanitize again
  @Post('/send-customer-message')
  public async sendCustomerMessage(): Promise<string> {
    return 'Message Successfully Sent.';
  }
}
