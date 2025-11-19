import { existsSync, readFileSync } from 'node:fs'

export interface Conf {
  server: {
    host: string
    port: number
  }
  datasource: {
    host: string
    port: number
    user: string
    password: string
    database: string
  }
}

export function parseConf(file: string): Conf {
  if (!existsSync(file)) {
    throw new Error(`conf ${file} not exists`)
  }
  return JSON.parse(readFileSync(file, 'utf-8'))
}
