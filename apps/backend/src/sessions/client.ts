import EventEmitter from 'node:events'
import { WebSocket } from 'ws'
import {
  Packager,
  type Call,
  type CallAnswer,
  type CancelCall,
  type EndCall,
  type Message,
  type RTCAnswer,
  type RTCCandidate,
  type RTCOffer,
  type RTCServer,
  type RTCServerResponse,
  type WithRequired,
  type MessageEvent,
} from '@demo/ws'
import { SocketSession } from './socket'

export interface ClientSessionOptions {
  owner: string | number
  /** 什么时间会话过期，过期后会自动从会话管理器中移除，毫秒时间戳，为 jwt 有效期 */
  expireAt?: number
}
/** 事件回调参数加上 ClientSession，是为了防止在绑定事件时出现函数嵌套调用，以便于清理回调 */
export interface ClientSessionEvent {
  /** 所有 socket 都关闭时触发 */
  offline: [ClientSession]
  /** 第一个 socket 连接上时触发 */
  online: [ClientSession]
  /** 会话过期时触发 */
  expire: [ClientSession]
  /** 收到消息时触发 */
  message: [Message, ClientSession]
  /** 发生错误时触发 */
  error: [Error, ClientSession]
  /** 手动关闭时触发 */
  close: [number, string, ClientSession]
  /** 信令 socket 连接时触发 */
  'signal-open': [ClientSession]
  /** 信令 socket 关闭时触发 */
  'signal-close': [ClientSession]

  [MessageEvent.Ping]: [Message, ClientSession]
  // [MessageEvent.Pong]: [Message]

  [MessageEvent.Call]: [WithRequired<Message<Call>, 'payload'>, ClientSession]
  [MessageEvent.CallAnswer]: [WithRequired<Message<CallAnswer>, 'payload'>, ClientSession]

  [MessageEvent.CancelCall]: [WithRequired<Message<CancelCall>, 'payload'>, ClientSession]
  [MessageEvent.EndCall]: [WithRequired<Message<EndCall>, 'payload'>, ClientSession]

  [MessageEvent.RTCOffer]: [WithRequired<Message<RTCOffer>, 'payload'>, ClientSession]
  [MessageEvent.RTCAnswer]: [WithRequired<Message<RTCAnswer>, 'payload'>, ClientSession]
  [MessageEvent.RTCCandidate]: [WithRequired<Message<RTCCandidate>, 'payload'>, ClientSession]

  [MessageEvent.RTCServer]: [WithRequired<Message<RTCServer>, 'id'>, ClientSession]
  // [MessageEvent.RTCServerResponse]: [Required<Message<RTCServerResponse>>]
}
export class ClientSession extends EventEmitter<ClientSessionEvent> {
  /** 客户端 token，用 token 当 id */
  readonly id: string
  /** 所属用户 Id */
  readonly owner: string | number
  /** 创建时间（毫秒时间戳） */
  readonly createdAt: number = Date.now()
  /** 过期时间（毫秒时间戳） */
  readonly expireAt?: number

  private _expireTimer?: NodeJS.Timeout
  private _signalSocket?: SocketSession
  private readonly _sockets: Set<SocketSession> = new Set()

  /** 上一次检测是否在线 */
  private _wasOnline: boolean = this.isOnline
  /** 会话是否已经手动关闭，即调用 close 方法 */
  private _isClosed: boolean = false

  get isExpired() {
    return this.expireAt && Date.now() > this.expireAt
  }

  get isClosed() {
    return this._isClosed || this.isExpired
  }

  get isOnline() {
    return !this.isClosed && Array.from(this._sockets).some((socket) => socket.readyState === WebSocket.OPEN)
  }

  get inCall() {
    return !this.isClosed && this._signalSocket?.readyState === WebSocket.OPEN
  }

  constructor(id: string, opts: ClientSessionOptions) {
    super()
    this.id = id
    this.owner = opts.owner
    this.expireAt = opts.expireAt

    if (this.expireAt) {
      const expiredGap = this.expireAt - this.createdAt
      if (expiredGap > 0) {
        this._expireTimer = globalThis.setTimeout(() => this._onClientExpire(), expiredGap)
      } else {
        this._onClientExpire()
      }
    }
  }

  private _doCleanTimer() {
    if (this._expireTimer) {
      globalThis.clearTimeout(this._expireTimer)
      this._expireTimer = void 0
    }
  }

  private _doEmitIfOnlineChanged() {
    if (this._wasOnline && !this.isOnline) {
      this.emit('offline', this)
      this._wasOnline = false
      // 下线了，关闭 signal socket
      this.closeSignalSocket(1000, 'client session offline')
    }
    if (!this._wasOnline && this.isOnline) {
      this.emit('online', this)
      this._wasOnline = true
    }
  }

  private _doCleanSocket(socket: SocketSession) {
    if (socket === this._signalSocket) {
      // SocketSession.close 方法已经清理了事件回调，这里不需要再清理
      // this._signalSocket?.removeAllListeners()
      this._signalSocket = void 0
      this.emit('signal-close', this)
    } else {
      // SocketSession.close 方法已经清理了事件回调，这里不需要再清理
      // socket.removeAllListeners()
      this._sockets.delete(socket)
      // 检测是否下线，即是否所有 socket 都关闭了
      this._doEmitIfOnlineChanged()
    }
  }

  private _doCloseSocket(socket: SocketSession, code?: number, reason?: string) {
    socket.close(code, reason)
    // 这里要清理 socket 事件回调，socket 调用 close 方法时并不会立即触发 close 事件，并非同步执行
    this._doCleanSocket(socket)
  }

  private _onClientExpire = () => {
    this.emit('expire', this)
    this.close(1000, 'client expired')
  }

  private _onSocketMessage = (message: Message) => {
    const msg = message as any
    this.emit('message', msg, this)
    this.emit(msg.event, msg, this)
  }

  private _onSocketError = (err: Error) => {
    this.emit('error', err, this)
  }

  private _onSocketClose = (code: number, reason: string, socket: SocketSession) => {
    console.log('socket close', code, reason)
    // socket.removeListener('message', onmessage)
    // socket.removeListener('error', onerror)
    this._doCleanSocket(socket)
  }

  private _doBindSocketEvent(socket: SocketSession) {
    socket.on('message', this._onSocketMessage)
    socket.on('error', this._onSocketError)
    socket.once('close', this._onSocketClose)
    return () => {
      socket.off('message', this._onSocketMessage)
      socket.off('error', this._onSocketError)
      socket.off('close', this._onSocketClose)
    }
  }

  /** 添加 socket 连接，只有处于 OPEN 状态的 socket 连接才会被添加，服务升级后 socket 已经处于 OPEN 状态，不会处于 CONNECTING 状态 */
  addSocket(raw: WebSocket, url?: string) {
    // 会话过期或者会话已经关闭时不添加 socket
    if (this.isClosed) return
    // 不设置重复的 socket
    if (this.hasSocket(raw)) return
    // 连接已经关闭的 socket 不会被添加
    if (raw.readyState !== WebSocket.OPEN) return

    const socket = new SocketSession(raw, url)
    // 绑定事件
    this._doBindSocketEvent(socket)
    this._sockets.add(socket)
    // 检查添加前是否离线
    this._doEmitIfOnlineChanged()
  }

  /** 关闭并移除指定 socket 连接 */
  closeSocket(raw: WebSocket, code?: number, reason?: string) {
    const socket = this.getSocket(raw)
    if (socket) this._doCloseSocket(socket, code, reason)
  }

  hasSocket(raw: WebSocket) {
    return Array.from(this._sockets).some((s) => s.raw === raw)
  }

  getSocket(raw: WebSocket) {
    return Array.from(this._sockets).find((s) => s.raw === raw)
  }

  getSignalSocket() {
    return this._signalSocket
  }

  setSignalSocket(raw: WebSocket, url?: string) {
    if (this.isClosed) return
    if (this._signalSocket?.raw === raw || raw.readyState !== WebSocket.OPEN) return
    if (!this.isOnline) throw new Error("can't add signal socket offline")
    this.closeSignalSocket(1000, 'signal socket replace')

    this._doBindSocketEvent((this._signalSocket = new SocketSession(raw, url)))
    this.emit('signal-open', this)
  }

  closeSignalSocket(code?: number, reason?: string) {
    if (!this._signalSocket) return
    this._doCloseSocket(this._signalSocket, code, reason)
  }

  send<T>(message: Message<T>) {
    if (this.isClosed) return
    this._sockets.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN) socket.send(message)
    })
  }

  sendToSignal<T>(message: Message<T>) {
    if (this.isClosed) return
    if (this._signalSocket?.readyState === WebSocket.OPEN) {
      this._signalSocket.send(message)
    }
  }

  ping() {
    const ping = Packager.preparePing()
    this.send(ping)
    this.sendToSignal(ping)
  }

  pong() {
    const pong = Packager.preparePong()
    this.send(pong)
    this.sendToSignal(pong)
  }

  sendCallAnswer(payload: Omit<CallAnswer, 'to'>) {
    this.send(Packager.prepareCallAnswer({ ...payload, to: this.owner }))
  }

  notifyIncomingCall(payload: Omit<Call, 'to'>) {
    this.send(Packager.prepareCall({ ...payload, to: this.owner }))
  }

  notifyCallAccepted(payload: Omit<Parameters<typeof Packager.prepareAcceptCall>[0], 'to'>) {
    this.send(Packager.prepareAcceptCall({ ...payload, to: this.owner }))
  }

  notifyCallDeclined(payload: Omit<Parameters<typeof Packager.prepareDeclineCall>[0], 'to'>) {
    this.send(Packager.prepareDeclineCall({ ...payload, to: this.owner }))
  }

  notifyCallMissed(payload: Omit<Parameters<typeof Packager.prepareMissCall>[0], 'to'>) {
    this.send(Packager.prepareMissCall({ ...payload, to: this.owner }))
  }

  notifyCallCancelled(payload: Omit<CancelCall, 'to'>) {
    this.send(Packager.prepareCancelCall({ ...payload, to: this.owner }))
  }

  notifyCallEnd(payload: Omit<EndCall, 'to'>) {
    this.sendToSignal(Packager.prepareEndCall({ ...payload, to: this.owner }))
  }

  sendRTCOffer(sdp: RTCOffer['sdp'], payload: Omit<RTCOffer, 'to' | 'sdp'>) {
    this.sendToSignal(Packager.prepareRTCOffer({ ...payload, to: this.owner, sdp }))
  }

  sendRTCAnswer(sdp: RTCAnswer['sdp'], payload: Omit<RTCAnswer, 'to' | 'sdp'>) {
    this.sendToSignal(Packager.prepareRTCAnswer({ ...payload, to: this.owner, sdp }))
  }

  sendRTCCandidate(candidate: RTCCandidate['candidate'], payload: Omit<RTCCandidate, 'to' | 'candidate'>) {
    this.sendToSignal(Packager.prepareRTCCandidate({ ...payload, to: this.owner, candidate }))
  }

  sendRTCServers(id: string | number, payload: RTCServerResponse) {
    this.sendToSignal(Packager.prepareRTCServerResponse(id, payload))
  }

  close(code?: number, reason?: string) {
    if (this.isClosed) return
    this._isClosed = true

    this._doCleanTimer()
    const closeCode = code ?? 1000
    const closeReason = reason ?? 'client session close'
    for (const socket of Array.from(this._sockets)) {
      this._doCloseSocket(socket, closeCode, closeReason)
    }
    this.closeSignalSocket(closeCode, closeReason)

    this.emit('close', closeCode, closeReason, this)
    this.removeAllListeners()
  }

  [Symbol.dispose]() {
    this.close()
  }
}
