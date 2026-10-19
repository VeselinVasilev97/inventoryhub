/**
 * Typed, validated access to the frontend environment variables.
 * Import `env` from here instead of reading `import.meta.env` directly.
 */

function requireUrl(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy apps/frontend/.env.example to .env.`,
    );
  }
  if (!URL.canParse(value)) {
    throw new Error(`Environment variable ${name} is not a valid URL: "${value}"`);
  }
  // Normalize: no trailing slash, so paths can be appended as `${base}/products`.
  return value.replace(/\/+$/, '');
}

export const env = {
  apiBaseUrl: requireUrl('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL),
} as const;
