import 'koa'
import type { Connection } from 'mysql2/promise'
import type { Conf } from '@/configs'
import type { ClientSession, UserSession, SessionManager } from '@/helpers'

declare module 'koa' {
  export type UserState = Readonly<{
    id: number
    username: string
    iat: number
    exp: number
  }>

  export type State = Readonly<{
    user?: UserState
    token?: string
  }>

  export type Session = Readonly<{
    manager: SessionManager
    user?: UserSession
    client?: ClientSession
  }>

  export type Injection = Readonly<{
    conn: Connection
    conf: Conf
    manager: SessionManager
  }>

  interface Context {
    readonly session: Session
    readonly state: State
    readonly inject: Injection
  }
}
