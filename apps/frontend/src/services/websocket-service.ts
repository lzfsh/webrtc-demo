import { useEffect } from 'react'
import { Env } from '@/configs'
import { TypedEvent } from '@/utils'
import { TokenService } from './token'
import { WebSocketClient, type WebSocketClientOptions } from './websocket-client'

export type WebSocketServiceEvent = {
  ping: () => void
  pong: () => void
}

export class WebSocketService extends TypedEvent<WebSocketServiceEvent> {
  private _client?: WebSocketClient
  static getURL(token?: string) {
    return token ? `${Env.WS_ENDPOINT}?token=${token}` : Env.WS_ENDPOINT
  }

  constructor(url: string | URL, opts?: WebSocketClientOptions)
  constructor(url: string | URL, protocol?: string | string[])
  constructor(url: string | URL, protocol?: string | string[], opts?: WebSocketClientOptions)
  constructor(...args: any[]) {
    super()
    // @ts-expect-error 参数和构造器类型一致
    this._client = new WebSocketClient(...args)
  }

  connect() {
    this._client?.connect()
  }

  close() {
    this._client?.close()
  }

  destroy() {
    this._client?.destroy()
  }
}

const service = new WebSocketService(WebSocketService.getURL(TokenService.getToken()), {
  connectWhenCreated: false,
})

export function useWebSocketService() {
  useEffect(() => {
    service.connect()
    return () => {
      service.close()
    }
  }, [])

  return service
}
