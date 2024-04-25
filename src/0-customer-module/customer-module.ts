import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CustomerController } from './customer-controller';
import { CustomerErrorHandler } from './providers/error';
import {
  NewCustomerRateLimit,
  ValidateNewCustomerBody,
} from './middleware/new-customer';

@Module({
  imports: [],
  providers: [CustomerErrorHandler],
  controllers: [CustomerController],
})
export class CustomerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(NewCustomerRateLimit, ValidateNewCustomerBody)
      .forRoutes('/api/customer/create-new-customer');
  }
}
