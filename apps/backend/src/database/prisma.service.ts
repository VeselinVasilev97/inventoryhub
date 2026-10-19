import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import type { Env } from '../config/env.validation';
import { PrismaClient } from '../generated/prisma/client';

/**
 * The single PrismaClient instance of the application, exposed as a NestJS
 * provider. Inject it wherever database access is needed:
 *
 *   constructor(private readonly prisma: PrismaService) {}
 *   this.prisma.product.findMany(...)
 *
 * Prisma 7 connects to PostgreSQL through a driver adapter (`pg`).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService<Env, true>) {
    const adapter = new PrismaPg({ connectionString: config.get('DATABASE_URL', { infer: true }) });
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Connected to PostgreSQL');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
