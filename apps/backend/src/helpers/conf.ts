import type { AuthConf, DatabaseConf } from '@/configs'
import jwt, { type VerifyOptions } from 'jsonwebtoken'
import mysql from 'mysql2/promise'

export function generateToken(payload: string | Buffer | object, opts: Partial<AuthConf> = {}) {
  const { secret = '', ...options } = opts
  // 转换 expiresIn 为秒
  if (options.expiresIn) {
    options.expiresIn = options.expiresIn / 1000
  }
  if (secret) {
    return jwt.sign(payload, secret, options)
  }
  return jwt.sign(payload, null, { ...options, algorithm: 'none' })
}

export function parseToken<T>(token: string, opts: Partial<Omit<AuthConf, 'expiresIn'>> = {}): T | undefined {
  try {
    const { secret = '' } = opts
    const options: VerifyOptions = {
      algorithms: opts?.algorithm ? [opts.algorithm] : !secret ? ['none'] : void 0,
      audience: opts?.audience as any,
      issuer: opts?.issuer as any,
    }
    return jwt.verify(token, secret, options) as T
  } catch {
    return
  }
}

export function createDBConnection(conf: DatabaseConf) {
  const { driver, ...restConf } = conf
  if (driver.toLowerCase() !== 'mysql') {
    throw new Error('only mysql driver is supported')
  }
  return mysql.createConnection(restConf)
}
