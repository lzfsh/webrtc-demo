/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { useEffect, useRef } from 'react'
import { TypedEvent } from '@/utils'

export const WSEvent = Object.freeze({
  Open: 'open',
  Message: 'message',
  Close: 'close',
  Error: 'error',
})

export type WebSocketEvent = {
  open: (this: WebSocketClient, ev: Event) => any
  message: (this: WebSocketClient, ev: MessageEvent) => any
  error: (this: WebSocketClient, ev: Event) => any
  close: (this: WebSocketClient, ev: CloseEvent) => any
}

export type Buffer = Parameters<WebSocket['send']>[0]

export interface WebSocketClientOptions {
  /** 二进制数据类型 */
  binaryType?: BinaryType
  /** 心跳时间间隔，单位毫秒，默认 20000，为 0 时不开启心跳。每隔 heartbeat 毫秒发送一次 ping 消息 */
  heartbeat?: number
  /** 心跳消息包装器 */
  ping?: () => Buffer
  isPing?: (data: Buffer) => boolean
  /** 心跳响应消息包装器 */
  pong?: () => Buffer
  isPong?: (data: Buffer) => boolean
  /** 是否自动响应心跳消息，默认 true */
  autoPong?: boolean
  /** 连接超时时间，单位毫秒，默认 30000，如果处于 CONNECTING 状态超过该时间，关闭连接 */
  timeout?: number
  /** 连接失败重试次数，默认 3 */
  retry?: number
  /** 是否在连接失败时重试，默认 true */
  shouldRetry?: (e: CloseEvent) => boolean
}

/** 补充 WebSocketClient 接口，添加事件监听方法 */
export interface WebSocketClient extends TypedEvent<WebSocketEvent> {
  onopen: WebSocketEvent['open'] | null
  onmessage: WebSocketEvent['message'] | null
  onclose: WebSocketEvent['close'] | null
  onerror: WebSocketEvent['error'] | null
}

export class WebSocketClient extends TypedEvent<WebSocketEvent> {
  static readonly CONNECTING = WebSocket.CONNECTING
  static readonly OPEN = WebSocket.OPEN
  static readonly CLOSING = WebSocket.CLOSING
  static readonly CLOSED = WebSocket.CLOSED

  readonly CONNECTING = WebSocket.CONNECTING
  readonly OPEN = WebSocket.OPEN
  readonly CLOSING = WebSocket.CLOSING
  readonly CLOSED = WebSocket.CLOSED

  private _url: string | URL
  private _protocol?: string | string[]
  private _binaryType: BinaryType = 'blob'
  private _buffers: Buffer[] = []

  private _socket: WebSocket
  private _isClosed: boolean = false

  private _retryCount: number = 0
  private _heartbeatTimer?: number
  private _timeoutTimer?: number
  private _retryTimer?: number
  private _options: Required<WebSocketClientOptions> = {
    binaryType: 'blob',
    heartbeat: 20000,
    ping: () => 'ping',
    isPing: (data: Buffer) => data.toString() === 'ping',
    pong: () => 'pong',
    isPong: (data: Buffer) => data.toString() === 'pong',
    autoPong: true,
    retry: 3,
    shouldRetry: () => true,
    timeout: 30000,
  }

  get url() {
    return this._socket?.url ?? this._url
  }

  get protocol(): string {
    return this._socket?.protocol ?? ''
  }

  get readyState() {
    return this._socket?.readyState ?? WebSocket.CLOSED
  }

  get binaryType() {
    return this._binaryType
  }
  set binaryType(value: BinaryType) {
    this._binaryType = value
    if (this._socket) {
      this._socket.binaryType = value
    }
  }

  get bufferedAmount() {
    return this._socket?.bufferedAmount ?? 0
  }

  get extensions() {
    return this._socket?.extensions ?? ''
  }

  constructor(url: string | URL, opts?: WebSocketClientOptions)
  constructor(url: string | URL, protocol?: string | string[])
  constructor(url: string | URL, protocol?: string | string[], opts?: WebSocketClientOptions)
  constructor(...args: any[]) {
    super()

    // eslint-disable-next-line prefer-const
    let [url, protocol, opts] = args
    if (typeof protocol !== 'string' && !Array.isArray(protocol)) {
      opts = protocol
      protocol = void 0
    }
    this._url = url
    this._protocol = protocol
    this._options = { ...this._options, ...opts }
    // 检查选项值是否大于 0
    for (const [key, value] of Object.entries(this._options)) {
      if (typeof value === 'number' && value < 0) {
        throw new Error(`WebSocketClient option ${key} must be greater than 0`)
      }
    }
    this._socket = this._connect(this._url, this._protocol)
  }

  private _cleanTimer() {
    if (this._timeoutTimer) window.clearTimeout(this._timeoutTimer)
    if (this._heartbeatTimer) window.clearInterval(this._heartbeatTimer)
    if (this._retryTimer) window.clearTimeout(this._retryTimer)
    this._timeoutTimer = this._heartbeatTimer = this._retryTimer = void 0
  }

  private _cleanSocket() {
    if (!this._socket) return
    this._socket.onopen = null
    this._socket.onmessage = null
    this._socket.onclose = null
    this._socket.onerror = null
  }

  private _cleanBuffer() {
    this._buffers = []
  }

  private _cleanEvent() {
    this.clear()
  }

  private _onOpen = (e: Event) => {
    // 清理定时器
    this._cleanTimer()
    window.clearTimeout(this._timeoutTimer)

    // 心跳间隔大于 0 时开启心跳
    if (this._options.heartbeat > 0) {
      this.ping()
      this._heartbeatTimer = window.setInterval(() => {
        this.ping()
      }, this._options.heartbeat)
    }

    // 发送缓存消息
    if (this._buffers.length > 0) {
      this._buffers.forEach((buffer) => this.send(buffer))
      this._buffers = []
    }

    this.emit(WSEvent.Open, e)
  }

  private _onMessage = (e: MessageEvent) => {
    // 自动响应心跳
    if (this._options.autoPong && this._options.isPing(e.data)) {
      this.pong()
    }
    this.emit(WSEvent.Message, e)
  }

  private _onError = (e: Event) => {
    this.emit(WSEvent.Error, e)
  }

  private _onClose = (e: CloseEvent) => {
    if (this._shouldRetry(e)) {
      const delay = Math.min(1000 * 2 ** this._retryCount, 30000) // 最大30秒
      this._retryTimer = window.setTimeout(() => {
        this._retryCount++
        this._connect(this._url, this._protocol)
      }, delay)
    } else {
      this.emit(WSEvent.Close, e)
    }
    this._cleanSocket()
  }

  private _shouldRetry(e: CloseEvent): boolean {
    // 如果是调用 close 关闭，或者因为内部错误导致的关闭，都不重试
    if (this._isClosed || [1000, 1001].includes(e.code)) return false
    return this._retryCount < this._options.retry && this._options.shouldRetry(e)
  }

  private _bindEvent(socket: WebSocket) {
    socket.onopen = this._onOpen
    socket.onmessage = this._onMessage
    socket.onclose = this._onClose
    socket.onerror = this._onError
    return () => {
      socket.onopen = null
      socket.onmessage = null
      socket.onclose = null
      socket.onerror = null
    }
  }

  private _connect(url: string | URL, protocol?: string | string[]) {
    // 初次调用时，this._socket 为 undefined，这里清理要判空
    // 如果当前 socket 正在连接，直接返回当前 socket
    if (this._socket && this._socket.readyState <= WebSocket.OPEN) return this._socket
    this._cleanTimer()
    this._cleanSocket()

    const socket = new WebSocket(url, protocol)
    socket.binaryType = this._options.binaryType
    this._bindEvent(socket)
    this._socket = socket

    // 开启超时定时器
    this._timeoutTimer = window.setTimeout(() => {
      if (this._socket && this._socket.readyState === WebSocket.CONNECTING) {
        this._socket.close(1000, 'connect timeout')
      }
    }, this._options.timeout)

    return this._socket
  }

  static {
    const WEBSOCKET_ONEVENT = Symbol('websocket')
    ;[WSEvent.Close, WSEvent.Error, WSEvent.Message, WSEvent.Open].forEach((method) => {
      Object.defineProperty(WebSocketClient.prototype, `on${method}`, {
        enumerable: true,
        get(this: WebSocketClient) {
          for (const listener of this.listeners(method)) {
            // @ts-expect-error a symbol property, value is true
            if (listener[WEBSOCKET_ONEVENT]) return listener
          }
          return null
        },
        set(this: WebSocketClient, fn: WebSocketEvent[typeof method] | null) {
          for (const listener of this.listeners(method)) {
            // @ts-expect-error a symbol property, value is true
            if (listener[WEBSOCKET_ONEVENT]) {
              this.removeListener(method, listener)
              break
            }
          }
          if (typeof fn === 'function') {
            // @ts-expect-error a symbol property, value is true
            fn[WEBSOCKET_ONEVENT] = true
            this.on(method, fn)
          }
        },
      })
    })
  }

  send(buffer: Buffer) {
    if (this._isClosed) return

    if (this._socket.readyState == WebSocket.OPEN) {
      this._socket.send(buffer)
    } else {
      this._buffers.push(buffer)
    }
  }

  ping() {
    this.send(this._options.ping())
  }

  pong() {
    this.send(this._options.pong())
  }

  close(code?: number, reason?: string) {
    if (this._isClosed) return
    this._isClosed = true

    this._cleanTimer()
    this._cleanBuffer()

    // 已关闭的 socket，无需关闭
    if (this._socket && this._socket.readyState <= WebSocket.OPEN) {
      this._socket?.close(code, reason)
    }
    this._cleanSocket()
    this._cleanEvent()
  }
}

export function useWebSocketClient(url: string | URL, opts?: WebSocketClientOptions): WebSocketClient | null
export function useWebSocketClient(url: string | URL, protocol?: string | string[]): WebSocketClient | null
export function useWebSocketClient(
  url: string | URL,
  protocol?: string | string[],
  opts?: WebSocketClientOptions,
): WebSocketClient | null
export function useWebSocketClient(...args: any[]) {
  const clientRef = useRef<WebSocketClient>(null)

  useEffect(() => {
    // @ts-expect-error 参数和构造器类型一致
    clientRef.current = new WebSocketClient(...args)
    return () => clientRef.current?.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, args)

  return clientRef.current
}
