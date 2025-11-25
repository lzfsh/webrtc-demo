import type { AuthConf, DatabaseConf } from '@/configs'
import jwt from 'jsonwebtoken'
import mysql from 'mysql2/promise'

export function generateToken(payload: string | Buffer | object, opts: AuthConf = {}) {
  const { secret, ...options } = opts
  // 转换 expiresIn 为秒
  if (options.expiresIn) {
    options.expiresIn = options.expiresIn / 1000
  }
  if (secret) {
    return jwt.sign(payload, secret, options)
  }
  return jwt.sign(payload, null, { ...options, algorithm: 'none' })
}

export function createDBConnection(conf: DatabaseConf) {
  const { driver, ...restConf } = conf
  if (driver.toLowerCase() !== 'mysql') {
    throw new Error('only mysql driver is supported')
  }
  return mysql.createConnection(restConf)
}
