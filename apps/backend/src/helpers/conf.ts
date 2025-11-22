import { existsSync, readFileSync } from 'node:fs'
import jwt from 'jsonwebtoken'
import mysql from 'mysql2/promise'
import type { Conf, JwtConf, DataSourceConf } from '@/configs'

export function parseConf(file: string): Conf {
  if (!existsSync(file)) {
    throw new Error(`config ${file} not exists`)
  }

  // 防止配置文件被修改
  const conf = JSON.parse(readFileSync(file, 'utf-8')) as Conf
  Object.values(conf).forEach((item) => {
    if (typeof item === 'object' && item !== null) {
      Object.freeze(item)
    }
  })
  return Object.freeze(conf)
}

export function generateToken(payload: string | Buffer | object, opts: JwtConf = {}) {
  const { secret, ...options } = opts
  if (secret) {
    return jwt.sign(payload, secret, options)
  }
  return jwt.sign(payload, null, { ...options, algorithm: 'none' })
}

export function createDBConnection(conf: DataSourceConf) {
  return mysql.createConnection(conf)
}
