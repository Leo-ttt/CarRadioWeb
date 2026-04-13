/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_SITE_URL: string
  readonly VITE_SENTRY_DSN: string
  readonly VITE_APP_VERSION: string
  readonly VITE_ENABLE_AI_ASSISTANT: string
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
