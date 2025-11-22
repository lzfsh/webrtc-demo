import type { SignOptions } from 'jsonwebtoken'

/** 尽可能保持应用简单不出错，这里只配置了 secret 和 expiresIn */
export interface JwtConf {
  readonly secret?: string
  readonly expiresIn?: SignOptions['expiresIn']
  // readonly algorithm?: SignOptions['algorithm']
  // readonly audience?: SignOptions['audience']
  // readonly issuer?: SignOptions['issuer']
}

export interface DataSourceConf {
  readonly host: string
  readonly port: number
  readonly user: string
  readonly password: string
  readonly database: string
}

/** 配置文件类型 */
export interface Conf {
  readonly auth?: JwtConf
  readonly datasource?: DataSourceConf
}

export const DefaultConf: Conf = Object.freeze({
  auth: {
    expiresIn: '7d',
  },
} as const)
