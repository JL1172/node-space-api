import {
  Body,
  Controller,
  FileTypeValidator,
  HttpStatus,
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
  ValidateRecipientId,
} from './interceptors/draft-message';
import { FileUtilProvider } from './providers/file-parsing';
import { CustomerErrorHandler } from './providers/error';
import { SaplingClient } from './providers/sapling-client';
import { DraftedMessageBody } from './dtos/DraftedMessageBody';

@Controller('/api/customer')
export class CustomerController {
  constructor(
    private readonly prisma: CustomerPrismaProvider,
    private readonly jwt: JwtProvider,
    private readonly fileUtil: FileUtilProvider,
    private readonly errorHandler: CustomerErrorHandler,
    private readonly saplingClient: SaplingClient,
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
  /*
   * rate limit
   * verify jwt is not blacklisted
   * validate jwt
   * validate request body (message_content etc.)
   * sanitize request body
   * validate recipient id exists in db (determined to just ignore sender id because that will come from jwt decoded)
   * validate files exist
   * validate mime type of files
   * validate size of files
   * sanitize file names
   * validate magic numbers, then proceed to parsing jpeg jpg and png, if none of those, called cloudmersive api to validate pdf, if not true, throw error
   * return originalMessage and then rephrased message
   */
  @Post('/draft-message-to-customer')
  @UseInterceptors(
    FilesInterceptor('files'),
    ValidateDraftMessageBody,
    SanitizeDraftMessageBody,
    ValidateRecipientId,
  )
  public async draftMessageToCustomer(
    @Body() body: DraftedMessageBody,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|pdf)' }),
          new MaxFileSizeValidator({ maxSize: 5000000 }),
        ],
      }),
    )
    files: Array<Express.Multer.File>,
  ): Promise<Record<string, any>> {
    try {
      const filesToReturn: Array<Express.Multer.File> =
        this.fileUtil.sanitizeFileName(files);
      for (let i: number = 0; i < filesToReturn.length; i++) {
        await this.fileUtil.validateFile(filesToReturn[i]);
      }
      const newMessage = await this.saplingClient.getRephrasedMessage(
        body.message_text,
      );
      const suggestedMessages = newMessage.data.results.map(
        (n) => n.replacement,
      );
      return { originalMessage: body, suggestedMessages };
    } catch (err) {
      this.errorHandler.reportError(
        err,
        err.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
  //todo
  //validate and sanitize again
  @Post('/send-customer-message')
  public async sendCustomerMessage(): Promise<string> {
    return 'Message Successfully Sent.';
  }
}
