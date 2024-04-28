import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { GlobalErrorMiddleware } from './global/global-utils/pipes/exception-filter';
import * as hpp from 'hpp';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.use(
    helmet({ noSniff: true, contentSecurityPolicy: true, hidePoweredBy: true }),
  );
  app.use(hpp());
  app.useGlobalFilters(new GlobalErrorMiddleware());
  await app.listen(process.env.PORT || 5000);
}
bootstrap();

export default bootstrap;
