import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CustomerController } from './customer-controller';
import { CustomerErrorHandler } from './providers/error';
import {
  NewCustomerRateLimit,
  SanitizeNewCustomerBody,
  ValidateJwtIsValid,
  ValidateNewCustomerBody,
  ValidateTokenIsNotBlacklisted,
  VerifyCustomerIsUnique,
} from './middleware/new-customer';
import { CustomerPrismaProvider } from './providers/prisma';
import { JwtProvider } from './providers/jwt';
import {
  DraftMessageRateLimit,
  VerifyJwtIsValidForDraftMessageToCustomerEndpoint,
} from './middleware/draft-message';
import { FileUtilProvider } from './providers/file-parsing';
import { Cloudmersive } from './providers/cloudmersive-client';
import { SaplingClient } from './providers/sapling-client';
import { Mailer } from './providers/mailer';
import {
  SetDefaultQueryParams,
  ValidateCustomerWithIdRelatedToUserExists,
  ValidateParamBody,
  ValidateQueryBody,
} from './middleware/get-messages';

@Module({
  imports: [],
  providers: [
    CustomerErrorHandler,
    CustomerPrismaProvider,
    JwtProvider,
    FileUtilProvider,
    Cloudmersive,
    SaplingClient,
    Mailer,
  ],
  controllers: [CustomerController],
})
export class CustomerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        NewCustomerRateLimit,
        ValidateTokenIsNotBlacklisted,
        ValidateJwtIsValid,
        ValidateNewCustomerBody,
        SanitizeNewCustomerBody,
        VerifyCustomerIsUnique,
      )
      .forRoutes('/api/customer/create-new-customer');
    consumer
      .apply(
        DraftMessageRateLimit,
        ValidateTokenIsNotBlacklisted,
        VerifyJwtIsValidForDraftMessageToCustomerEndpoint,
      )
      .forRoutes(
        '/api/customer/draft-message-to-customer',
        '/api/customer/send-customer-message',
        '/api/customer/view-messages/:id',
      );
    consumer
      .apply(
        ValidateParamBody,
        SetDefaultQueryParams,
        ValidateQueryBody,
        ValidateCustomerWithIdRelatedToUserExists,
      )
      .forRoutes('/api/customer/view-messages/:id');
  }
}
