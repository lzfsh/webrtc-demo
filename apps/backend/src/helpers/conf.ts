import type { Conf } from '@/configs'
import { existsSync, readFileSync } from 'node:fs'

export function parseConf(file: string): Conf {
  if (!existsSync(file)) {
    throw new Error(`conf ${file} not exists`)
  }
  return JSON.parse(readFileSync(file, 'utf-8'))
}
