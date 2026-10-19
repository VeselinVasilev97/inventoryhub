import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { Env } from './config/env.validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  // Every route is served under /api, e.g. GET /api/health.
  app.setGlobalPrefix('api');

  // Allow the React dev server (or the configured origins) to call the API.
  app.enableCors({
    origin: config.get('CORS_ORIGIN', { infer: true }),
    credentials: true,
  });

  // Runs onModuleDestroy hooks (e.g. closing the DB pool) on SIGTERM/SIGINT.
  app.enableShutdownHooks();

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  Logger.log(`API listening on http://localhost:${String(port)}/api`, 'Bootstrap');
}

void bootstrap();
