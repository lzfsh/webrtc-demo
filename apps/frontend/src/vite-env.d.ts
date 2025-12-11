/// <reference types="vite/client" />

interface ViteTypeOptions {
  // 添加这行代码，你就可以将 ImportMetaEnv 的类型设为严格模式，
  // 这样就不允许有未知的键值了。
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  /** 接口前缀，本地开发使用 /api，生产和测试环境不使用 */
  readonly VITE_APP_API_PREFIX?: string
  /** 本地开发服务器 api 接口代理地址 */
  readonly VITE_APP_API_TARGET?: string
  /** 本地开发服务器 websocket 接口代理地址 */
  readonly VITE_APP_WS_TARGET?: string
  /** 本地开发服务器 websocket 接口地址 */
  readonly VITE_APP_WS_PREFIX?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
