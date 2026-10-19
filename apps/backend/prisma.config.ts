// Prisma CLI configuration (Prisma 7+).
// Used by `prisma migrate`, `prisma generate`, `prisma studio`, etc.
// The running NestJS application does NOT use this file; it receives the
// connection string through @nestjs/config (see src/database/prisma.service.ts).
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // `process.env` (instead of Prisma's strict `env()` helper) lets commands
    // that do not need a database — `prisma generate`, `prisma validate` —
    // run without DATABASE_URL (fresh clone, CI). Commands that do need a
    // database (`migrate dev`, `migrate deploy`, ...) still fail with a clear
    // error when it is missing.
    url: process.env.DATABASE_URL,
  },
});
