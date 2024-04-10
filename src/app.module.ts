import { Module } from '@nestjs/common';
import { AuthenticationModule } from './auth/auth-module';
import { PrismaProvider } from './providers/prisma';

@Module({
  imports: [AuthenticationModule],
  controllers: [],
  providers: [PrismaProvider],
})
export class AppModule {}
