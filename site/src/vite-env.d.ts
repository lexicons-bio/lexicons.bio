/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the HappyView instance serving the XRPC endpoints. */
  readonly VITE_HAPPYVIEW_URL?: string;
  /** Public `hvc_` API client key. XRPC rejects requests without one. */
  readonly VITE_HAPPYVIEW_CLIENT_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
