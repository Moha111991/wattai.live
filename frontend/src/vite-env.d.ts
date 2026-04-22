/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Optional: explicit declaration for virtual:pwa-register if TS still complains
declare module 'virtual:pwa-register' {
  interface RegisterSWOptions {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
  }

  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => void
}
