import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Validates and types process.env (+ apps/backend/.env) at startup.
      validationSchema: envSchema,
    }),
    DatabaseModule,
    HealthModule,
    // Feature modules (src/modules/*) are registered here as you build them.
  ],
})
export class AppModule {}
