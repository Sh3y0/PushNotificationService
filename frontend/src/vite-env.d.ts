/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ONESIGNAL_APP_ID?: string;
  readonly VITE_API_URL?: string;
  /** Same value as backend `API_KEY` for `x-api-key` on POST /send (exposed in client bundle). */
  readonly VITE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
