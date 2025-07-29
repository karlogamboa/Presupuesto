/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string
  readonly VITE_LAMBDA_URL: string
  readonly VITE_OKTA_SLO_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}