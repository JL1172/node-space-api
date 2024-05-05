import {
  Body,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { CustomerPrismaProvider } from './providers/prisma';
import {
  NewCustomerBody,
  NewCustomerBodyToInsertIntoDb,
} from './dtos/NewCustomerBody';
import { JwtProvider } from './providers/jwt';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  SanitizeDraftMessageBody,
  ValidateDraftMessageBody,
} from './interceptors/draft-message';
import { FileUtilProvider } from './providers/file-parsing';
import { CustomerErrorHandler } from './providers/error';

@Controller('/api/customer')
export class CustomerController {
  constructor(
    private readonly prisma: CustomerPrismaProvider,
    private readonly jwt: JwtProvider,
    private readonly fileUtil: FileUtilProvider,
    private readonly errorHandler: CustomerErrorHandler,
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
  //todo
  //draft message to customer
  /*
   1. rate limit (j)
   2. validate that a jwt is present in the authorization (j)
   3. validate jwt is not blacklisted in db (j)
   4. validate jwt is valid (j)
   5. validate that a files array is present and the request body is correct (j)
   6. validate size and mime type of file (j)
   7. sanitize the request body (j)
   8. sanitize the file names 
   9. validate magic numbers with their correct magic numbers
   10. validate png and jpeg files
   11. validate customer with id exists and sender with id exists and matches jwt token 
  */
  @Post('/draft-message-to-customer')
  @UseInterceptors(
    FilesInterceptor('files'),
    ValidateDraftMessageBody,
    SanitizeDraftMessageBody,
  )
  public async draftMessageToCustomer(
    @Body() body: any,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|pdf)' }),
          new MaxFileSizeValidator({ maxSize: 500000 }),
        ],
      }),
    )
    files: Array<Express.Multer.File>,
  ): Promise<Record<string, any>> {
    try {
      const filesToReturn: Array<Express.Multer.File> =
        await this.fileUtil.validateFiles(files);
      //just return the preview of the message
      // return [...filesToReturn, body];
      //todo need to finish png parsing potentially look for another option, png api?? parses correctly on hot refresh not anytime after, jpg is no problem
      return [...filesToReturn, body];
    } catch (err) {
      this.errorHandler.reportError(err, err.status);
    }
  }
  //todo
  //send drafted message to ai in order to get enhanced message
  @Post('/ai-message-recommendation')
  public async getAiRecommendation(): Promise<string> {
    //return the preview of the ai message and the original
    return 'Here is your message and the ai recommended message.';
  }
  //todo
  //validate and sanitize again
  @Post('/send-customer-message')
  public async sendCustomerMessage(): Promise<string> {
    return 'Message Successfully Sent.';
  }
}
