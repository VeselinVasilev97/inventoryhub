/// <reference types="vite/client" />

// Type declarations for the VITE_* variables defined in .env files.
// Add a line here whenever you add a new variable.
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
