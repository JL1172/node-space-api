import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ErrorMiddleware } from './middleware/error';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.use(helmet());
  app.useGlobalFilters(new ErrorMiddleware());
  await app.listen(process.env.PORT || 5000);
}
bootstrap();
