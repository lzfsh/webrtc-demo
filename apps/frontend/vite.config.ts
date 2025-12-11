import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import ssl from '@vitejs/plugin-basic-ssl'

/**
 * @see {@link https://vite.dev/config/}
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  console.log(`mode: ${mode}, loaded env: ${JSON.stringify(env, null, 2)}`)
  /** 具体项配置说明见  src/vite-env.d.ts 或者 README.md#env */
  const conf = {
    apiPrefix: env.VITE_APP_API_PREFIX ?? '/api',
    apiTarget: env.VITE_APP_API_TARGET ?? 'http://localhost:3000',
    wsTarget: env.VITE_APP_WS_TARGET ?? 'ws://localhost:3000',
    wsPrefix: env.VITE_APP_WS_PREFIX ?? '/api/ws/connect',
  }
  console.log(`vite server config: ${JSON.stringify(conf, null, 2)}`)

  return {
    plugins: [react(), ssl()],
    resolve: {
      alias: { '@': '/src/' },
    },
    server: {
      proxy: {
        [`^${conf.apiPrefix}`]: {
          target: conf.apiTarget,
          changeOrigin: true,
        },
        [`^${conf.wsPrefix}`]: {
          target: conf.wsTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
