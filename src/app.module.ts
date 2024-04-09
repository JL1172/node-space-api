import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ValidateRegistrationBody } from './auth/middleware/registration';

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ValidateRegistrationBody)
      .forRoutes('/api/auth/registration');
  }
}
