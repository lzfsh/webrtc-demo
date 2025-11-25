import { deepFreeze } from '@/utils'

/** 尽可能保持应用简单不出错，这里只配置了 secret 和 expiresIn（时间单位统一为毫秒） */
export interface AuthConf {
  readonly secret?: string
  /** token 有效期，单位毫秒，默认值为 7 天 */
  readonly expiresIn?: number
  // readonly algorithm?: SignOptions['algorithm']
  // readonly audience?: SignOptions['audience']
  // readonly issuer?: SignOptions['issuer']
}

export interface WebSocketConf {
  readonly port?: number
  /** ws 心跳间隔，单位毫秒 */
  readonly heartbeat?: number
}

export interface ServerConf {
  // 服务器端口
  readonly port?: number
  readonly websocket?: WebSocketConf
  readonly auth?: AuthConf
}

export interface DatabaseConf {
  readonly driver: 'mysql'
  readonly host: string
  readonly port: number
  readonly user: string
  readonly password: string
  readonly database: string
}

export interface DataConf {
  // 数据库配置
  database?: DatabaseConf
}

/** 配置文件类型 */
export interface Conf {
  readonly server?: ServerConf
  readonly data?: DataConf
}

/** 入口文件处需要这些最小默认化配置，勿删除 */
export const defaultConf: Conf = deepFreeze({
  server: {
    port: 3000,
    webSocket: {
      heartbeat: 20 * 1000, // 20s
    },
    auth: {
      expiresIn: 7 * 24 * 60 * 60 * 1000, // 7d
    },
  },
})
