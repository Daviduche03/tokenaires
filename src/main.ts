import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppConfig } from './config/configuration';
import { API_PREFIX, JSON_BODY_LIMIT } from './config/constants';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bodyParser: false,
  });
  const config = app.get(ConfigService).getOrThrow<AppConfig>('app');
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
  app.set('trust proxy', 1);
  app.use(helmet());
  app.enableCors({ origin: config.corsOrigins, methods: ['GET', 'POST'] });
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();
  await app.listen(config.port);
  Logger.log(
    `Tokenaires API on http://localhost:${config.port}/${API_PREFIX}`,
    'Bootstrap',
  );
}

void bootstrap();
