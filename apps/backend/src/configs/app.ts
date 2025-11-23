export interface AppConf {
  readonly name: string
  readonly description: string
  readonly version: string
  readonly port: number
}

export const DEFAULT_APP_CONF: AppConf = Object.freeze({
  name: process.env.NAME ?? '@demo/server',
  description: process.env.DESCRIPTION ?? 'Backend server for demo.',
  version: process.env.VERSION ?? '1.0.0',
  port: 3000,
})
