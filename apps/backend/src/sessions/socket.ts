import EventEmitter from 'node:events'
import { WebSocket } from 'ws'
import { JSONSerializer, type Message, type Serializer } from '@demo/ws'

export type BufferLike = Parameters<WebSocket['send']>[0]

/** 事件回调参数加上 SocketSession，是为了防止在绑定事件时出现函数嵌套调用，以便于清理回调 */
export interface SocketEvent {
  /** 连接成功 */
  open: [SocketSession]
  /** 收到消息 */
  message: [Message, SocketSession]
  /** 发生错误 */
  error: [Error, SocketSession]
  /** 连接关闭 */
  close: [number, string, SocketSession]
}
export class SocketSession extends EventEmitter<SocketEvent> {
  static readonly CONNECTING = 0 as const
  static readonly OPEN = 1 as const
  static readonly CLOSING = 2 as const
  static readonly CLOSED = 3 as const

  private readonly _url?: string
  private readonly _room?: string
  /** socket 上次活跃时间，如果需要在多少时间后没有收到消息，调用 close 方法断开连接 */
  private _lastActiveAt: number = Date.now()
  private readonly _serializer: Serializer = JSONSerializer

  private readonly _socket: WebSocket

  get lastActiveAt() {
    return this._lastActiveAt
  }

  get raw() {
    return this._socket
  }

  get binaryType() {
    return this._socket.binaryType
  }

  set binaryType(type: WebSocket['binaryType']) {
    this._socket.binaryType = type
  }

  get bufferedAmount() {
    return this._socket.bufferedAmount
  }

  get extensions() {
    return this._socket.extensions
  }

  get protocol() {
    return this._socket.protocol
  }

  get readyState() {
    return this._socket.readyState
  }

  get url() {
    return this._socket.url ?? this._url
  }

  /**
   * why pass url? socket.url is undefined.
   * @see {@link https://github.com/websockets/ws/pull/1778}
   **/
  constructor(socket: WebSocket, url?: string) {
    super()

    this._doBindEvent((this._socket = socket))
    this._socket.binaryType = 'arraybuffer'

    // debug
    this._url = url
    this._room = new URL(this.url, 'http://localhost').searchParams.get('room') ?? void 0
  }

  private _doClean() {
    this._socket.removeAllListeners()
    this.removeAllListeners()
  }

  private _onSocketOpen = () => {
    this.emit('open', this)
    console.log('url', this.url)
  }

  private _onSocketMessage = (data: BufferLike, isBinary: boolean) => {
    try {
      this._lastActiveAt = Date.now()
      const raw = isBinary && data instanceof ArrayBuffer ? data : data.toString()
      const message = this._serializer.deserialize<Message>(raw)

      // debug
      if (this._room) {
        console.log(`room[${this._room}] receive: `, JSON.stringify(message))
      } else {
        console.log(`receive: `, JSON.stringify(message))
      }
      // if (message.event === MessageEvent.Ping) {
      //   this.send(Packager.preparePong())
      // }
      this.emit('message', message, this)
    } catch (err) {
      this.emit('error', err as Error, this)
    }
  }

  private _onSocketError = (err: Error) => {
    this.emit('error', err, this)
  }

  private _onSocketClose = (code: number, reason: Buffer) => {
    this.emit('close', code, reason.toString(), this)
    this._doClean()
  }

  private _doBindEvent(socket: WebSocket) {
    socket.on('open', this._onSocketOpen)
    socket.on('message', this._onSocketMessage)
    socket.on('error', this._onSocketError)
    socket.once('close', this._onSocketClose)
    return () => {
      socket.off('open', this._onSocketOpen)
      socket.off('message', this._onSocketMessage)
      socket.off('error', this._onSocketError)
      socket.off('close', this._onSocketClose)
    }
  }

  send<T>(message: Message<T>) {
    // debug
    if (this._room) {
      console.log(`room[${this._room}] send: `, JSON.stringify(message))
    } else {
      console.log(`send: `, JSON.stringify(message))
    }
    this._socket.send(this._serializer.serialize(message))
  }

  close(code?: number, reason?: string) {
    this._socket.close(code, reason)
  }

  [Symbol.dispose]() {
    this.close()
  }
}
