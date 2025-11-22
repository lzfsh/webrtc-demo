import 'koa'
import type { Connection } from 'mysql2/promise'
import type { Conf } from '@/configs'

declare module 'koa' {
  export type State = Readonly<{
    user: {
      id: number
    }
    token: string
  }>

  export type Injection = Readonly<{
    conn: Connection
    conf: Conf
  }>

  interface Context {
    readonly state: State
    readonly inject: Injection
  }
}
