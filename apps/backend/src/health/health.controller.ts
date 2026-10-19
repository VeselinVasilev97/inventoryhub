import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface HealthResponse {
  status: 'ok' | 'error';
  database: 'up' | 'down';
  timestamp: string;
}

/**
 * GET /api/health — liveness/readiness check.
 * Returns 200 when the API and the database are reachable, 503 otherwise.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<HealthResponse> {
    const timestamp = new Date().toISOString();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      const body: HealthResponse = { status: 'error', database: 'down', timestamp };
      throw new ServiceUnavailableException(body);
    }

    return { status: 'ok', database: 'up', timestamp };
  }
}
