import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Query,
  Req,
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
import { Request } from 'express';
import { Mailer } from './providers/mailer';
import { ParamBody, QueryBody } from './dtos/ViewMessagesBodies';

@Controller('/api/customer')
export class CustomerController {
  constructor(
    private readonly mailer: Mailer,
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
  @Post('/send-customer-message')
  @UseInterceptors(
    FilesInterceptor('files'),
    ValidateDraftMessageBody,
    SanitizeDraftMessageBody,
    ValidateRecipientId,
  )
  public async sendCustomerMessage(
    @Body() body: DraftedMessageBody,
    @Req() req: Request,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|pdf)' }),
          new MaxFileSizeValidator({ maxSize: 5000000 }),
        ],
      }),
    )
    files: Array<Express.Multer.File>,
  ): Promise<string> {
    try {
      const filesToReturn: Array<Express.Multer.File> =
        this.fileUtil.sanitizeFileName(files);
      for (let i: number = 0; i < filesToReturn.length; i++) {
        await this.fileUtil.validateFile(filesToReturn[i]);
      }
      //first insert message with:
      /**
       * message_subject
       * message_text
       * message_sender_id (from jwt token)
       * message_recipient_id
       */
      //then create blog media with the message id that comes from creating message
      /**
       * mime_type
       * filename
       * size
       * data
       * message_id
       */
      this.jwt.validateJwtToken(req.headers.authorization);
      const id: number = this.jwt.getDecodedJwtToken().id;
      const recipientEmail = await this.prisma.getCustomerById(
        body.message_recipient_id,
        id,
      );
      const messageToInsertIntoDb: {
        message_subject: string;
        message_text: string;
        message_sender_id: number;
        message_recipient_id: number;
      } = {
        message_recipient_id: Number(recipientEmail.id),
        message_subject: body.message_subject,
        message_text: body.message_text,
        message_sender_id: Number(id),
      };
      const filesToInsertIntoDb: {
        mime_type: string;
        filename: string;
        size: number;
        data: Buffer;
      }[] = filesToReturn.map((n) => ({
        filename: n.originalname,
        mime_type: n.mimetype,
        size: n.size,
        data: n.buffer,
      }));
      //this is the format nodemailer expects
      const filesToMail = filesToReturn.map((n) => ({
        filename: n.originalname,
        content: n.buffer,
      }));
      await this.mailer.draftEmail(
        recipientEmail.email,
        body.message_subject,
        body.message_text,
        filesToMail,
      );
      await this.prisma.createMessage(
        messageToInsertIntoDb,
        filesToInsertIntoDb,
      );
      return `Successfully Sent Message To ${recipientEmail.email}`;
    } catch (err) {
      this.errorHandler.reportError(
        err,
        err.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
  @Get('/view-messages/:id')
  public async getMessages(
    @Req() req: Request,
    @Query() query: QueryBody,
    @Param() params: ParamBody,
  ) {
    this.jwt.validateJwtToken(req.headers.authorization);
    const id = this.jwt.getDecodedJwtToken().id;
    const messages = await this.prisma.getMessagesWithQueryParams(
      Number(id),
      query,
      params,
    );
    return messages;
  }
}
