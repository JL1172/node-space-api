import { Module } from '@nestjs/common';
import { CustomerController } from './customer-controller';

@Module({
  imports: [],
  providers: [],
  controllers: [CustomerController],
})
export class CustomerModule {}
