import { existsSync, readFileSync } from 'node:fs'
import { deepFreeze } from '@/utils'
import { defaultConf, type Conf } from './types'

/** 解析配置文件 */
export function parseConf(file: string): Conf {
  if (!existsSync(file)) {
    throw new Error(`config ${file} not exists`)
  }

  // 防止配置对象被意外修改
  const conf = JSON.parse(readFileSync(file, 'utf-8')) as Conf
  return deepFreeze(conf)
}

/** 合并多个配置 */
export function mergeConf(...configs: Conf[]): Conf {
  const conf = configs.reduce(
    (acc, cur) => ({
      ...acc,
      ...cur,
      server: {
        ...acc.server,
        ...cur.server,
        websocket: {
          ...acc.server?.websocket,
          ...cur.server?.websocket,
        },
        auth: {
          ...acc.server?.auth,
          ...cur.server?.auth,
        } as any,
      },
      data: {
        ...acc.data,
        ...cur.data,
        database: {
          ...acc.data?.database,
          ...cur.data?.database,
        } as any,
      },
    }),
    {} as Conf,
  )
  return deepFreeze(conf)
}

/** 合并多个配置，包括默认配置，默认配置优先级最低 */
export function mergeConfWithDefaults(...configs: Conf[]): Conf {
  return mergeConf(defaultConf, ...configs)
}
