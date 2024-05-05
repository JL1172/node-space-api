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

@Module({
  imports: [],
  providers: [
    CustomerErrorHandler,
    CustomerPrismaProvider,
    JwtProvider,
    FileUtilProvider,
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
      .forRoutes('/api/customer/draft-message-to-customer');
  }
}
