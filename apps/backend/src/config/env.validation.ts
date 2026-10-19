import { z } from 'zod';

/**
 * Schema for the environment variables the API needs.
 *
 * Validated once at startup by ConfigModule (see app.module.ts). If a value
 * is missing or invalid the application refuses to start with a clear error,
 * instead of failing later at runtime.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  /** Comma-separated list of allowed CORS origins. */
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    ),
});

/** Validated, typed environment. Use with `ConfigService<Env, true>`. */
export type Env = z.output<typeof envSchema>;
