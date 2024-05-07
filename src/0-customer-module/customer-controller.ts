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
  Put,
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
import { QueryParamsBody2 } from './dtos/ViewCustomerBodies';
import { UpdatedCustomerBody } from './dtos/UpdatedCustomerBody';
import { Customer, Todo } from '@prisma/client';
import { CustomerTodo } from './dtos/CustomerTodoBody';

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
    try {
      const user_id: number = this.jwt.getDecodedJwtToken().id;
      const newCustomer: NewCustomerBodyToInsertIntoDb = { ...body, user_id };
      await this.prisma.createNewCustomer(newCustomer);
      return 'Successfully Created Customer.';
    } catch (err) {
      this.errorHandler.reportError(
        'An Unexpected Problem Occurred.',
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
      if (!this.jwt.validateJwtToken(req.headers.authorization)) {
        this.errorHandler.reportError(
          'Token Expired.',
          HttpStatus.UNAUTHORIZED,
        );
      }
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
        err?.inner?.message || err,
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
    try {
      this.jwt.validateJwtToken(req.headers.authorization);

      const id = this.jwt.getDecodedJwtToken().id;
      const messages = await this.prisma.getMessagesWithQueryParams(
        Number(id),
        query,
        params,
      );
      return messages;
    } catch (err) {
      this.errorHandler.reportError(
        err?.inner?.message || err.message,
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  /**
   * rate limit()
   * validate jwt is not blacklisted()
   * validate jwt()
   * transform default query value if none are present ()
   * validate query params ()
   * if query.id is present validate customer with id exists in relation to user id ()
   * if query.id is present return customerbyid else return all customer with relation to user_id ()
   */
  @Get('/view-customers')
  public async getCustomers(
    @Req() req: Request,
    @Query() query: QueryParamsBody2,
  ) {
    try {
      this.jwt.validateJwtToken(req.headers.authorization);
      const decodedTokenId = this.jwt.getDecodedJwtToken();
      const { id = 'all' } = query;
      if (id === 'all') {
        return await this.prisma.getCustomersAssociatedWithUserId(
          decodedTokenId.id,
        );
      } else {
        return await this.prisma.getCustomerById(Number(id), decodedTokenId.id);
      }
    } catch (err) {
      this.errorHandler.reportError(
        err?.inner?.message || 'An Unexpected Problem Occurred.',
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Put('/update-customer-info')
  /**
   * rate limit
   * jwt not blacklisted?
   * jwt valid
   * validate body (see customer body in prisma)
   * sanitize body
   * validate customer with id exists
   * validate customer is unique (minus itself)
   * put changes
   */
  public async updateCustomer(
    @Body() body: UpdatedCustomerBody,
  ): Promise<Customer> {
    try {
      const id = this.jwt.getDecodedJwtToken().id;
      return await this.prisma.updateCustomer(body, id);
    } catch (err) {
      this.errorHandler.reportError(
        'An Unexpected Error Occurred. Try Again.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Post('/create-customer-todo')
  /** (this will be like reach out 4 times this week or something)
   * rate limit
   * jwt not blacklisted
   * jwt valid
   * validate req.body
   * sanitize req.body
   * post changes
   */
  public async createCustomerTodo(@Body() body: CustomerTodo) {
    const dateToInsertIntoDb = new Date(body.deadline_date);
    body.deadline_date = dateToInsertIntoDb;
    const result: Todo = await this.prisma.createCustomerTodo(body);
    return result;
  }
  @Put('/update-customer-todo')
  /**
   * rate limit
   * jwt not blacklisted
   * jwt valid
   * validate req.body
   * sanitize req.body
   * post changes
   */
  public async updateCustomerTodo() {
    return 'Successfully updated customer todo';
  }
  @Get('/customer-todos/:id')
  /**
   * rate limit
   * jwt not blacklisted
   * jwt valid
   * id is integer
   * validte customer with id related to user with id exists
   * query parameters will be completed=false || completed=true || completed=all (default query parameters set)
   * sortby deadline that is the closest
   * return todos
   */
  public async getCustomerTodos() {
    return 'Successfully get customer todos';
  }
}
