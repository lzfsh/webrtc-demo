import 'koa'
import type { Connection } from 'mysql2/promise'
import type { Conf } from '../src/utils'

declare module 'koa' {
  interface Context {
    readonly inject: Readonly<{
      conn: Connection
      conf: Conf
    }>
  }
}
