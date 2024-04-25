import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CustomerController } from './customer-controller';
import { CustomerErrorHandler } from './providers/error';
import {
  NewCustomerRateLimit,
  SanitizeNewCustomerBody,
  ValidateJwtIsValid,
  ValidateNewCustomerBody,
  VerifyCustomerIsUnique,
} from './middleware/new-customer';
import { CustomerPrismaProvider } from './providers/prisma';
import { JwtProvider } from './providers/jwt';

@Module({
  imports: [],
  providers: [CustomerErrorHandler, CustomerPrismaProvider, JwtProvider],
  controllers: [CustomerController],
})
export class CustomerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        NewCustomerRateLimit,
        ValidateJwtIsValid,
        ValidateNewCustomerBody,
        SanitizeNewCustomerBody,
        VerifyCustomerIsUnique,
      )
      .forRoutes('/api/customer/create-new-customer');
  }
}
