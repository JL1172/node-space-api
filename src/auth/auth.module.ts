import { Module } from '@nestjs/common';
import { AuthenticationController } from './auth.controller';

@Module({
  imports: [],
  controllers: [AuthenticationController],
  providers: [],
})
export class AuthModule {}
