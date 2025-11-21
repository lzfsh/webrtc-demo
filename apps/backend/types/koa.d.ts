import 'koa'
import type { Connection } from 'mysql2/promise'
import type { Conf } from '@/helpers'

declare module 'koa' {
  export type Injection = Readonly<{
    conn: Connection
    conf: Conf
  }>

  interface Context {
    readonly inject: Injection
  }
}
