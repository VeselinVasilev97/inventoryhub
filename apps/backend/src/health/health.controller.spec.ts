import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  const queryRaw = jest.fn<Promise<unknown>, []>();

  beforeEach(async () => {
    queryRaw.mockReset();

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      // Unit test: the real database is replaced by a minimal fake.
      providers: [{ provide: PrismaService, useValue: { $queryRaw: queryRaw } }],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it('reports ok when the database responds', async () => {
    queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await expect(controller.check()).resolves.toMatchObject({ status: 'ok', database: 'up' });
  });

  it('throws 503 when the database is unreachable', async () => {
    queryRaw.mockRejectedValue(new Error('connection refused'));

    await expect(controller.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
