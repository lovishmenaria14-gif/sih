/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEV_BACKEND_PORT?: string;
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
