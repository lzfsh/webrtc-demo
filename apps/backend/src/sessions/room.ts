import EventEmitter from 'node:events'
import {
  CallType,
  MessageEvent,
  type Call,
  type Message,
  type WithRequired,
  type RTCServer,
  type RTCServerResponse,
} from '@demo/ws'
import type { ClientSession } from './client'
import type { UserSession } from './user'

export interface RoomSessionOptions {
  /** 通话类型，视频通话或者音频通话，默认音频通话 */
  type?: Call['type']
  /** 会话过期时间戳，默认当前时间加超时时间一分半，过期了触发 expire 事。如果在此期间没有建立通话连接，向双方发送超时消息 */
  timeoutAt?: number
}
/** 事件回调参数加上 RoomSession，是为了防止在绑定事件时出现函数嵌套调用，以便于清理回调 */
export interface RoomSessionEvent {
  /** 接听者 callee 信令 socket 连接成功时触发 */
  connected: [RoomSession]
  /** 会话超时时触发，同时触发 close 事件，事件触发后关闭会话 */
  timeout: [RoomSession]
  /** 信令 socket 掉线时触发，同时触发 close 事件，事件触发后关闭会话 */
  disconnect: [ClientSession, RoomSession]
  error: [Error, RoomSession]
  close: [number, string, RoomSession]
}
export class RoomSession extends EventEmitter<RoomSessionEvent> {
  static readonly TIMEOUT = (60 + 30) * 1000

  readonly id: string
  readonly type: Call['type'] = CallType.Audio
  readonly caller: UserSession
  readonly callee: UserSession
  readonly createdAt: number = Date.now()
  readonly timeoutAt: number = this.createdAt + RoomSession.TIMEOUT

  private _timeoutTimer?: NodeJS.Timeout
  private _callerClient?: ClientSession
  private _calleeClient?: ClientSession

  /** 会话是否已经手动关闭，即调用 close 方法 */
  private _isClosed: boolean = false

  get inCall() {
    return this._callerClient?.inCall && this._calleeClient?.inCall
  }

  get isClosed() {
    return this._isClosed
  }

  constructor(id: string, caller: UserSession, callee: UserSession, opts: RoomSessionOptions = {}) {
    super()
    this.id = id
    this.caller = caller
    this.callee = callee
    if (opts.type) this.type = opts.type
    if (opts.timeoutAt) this.timeoutAt = opts.timeoutAt

    const timeoutGap = this.timeoutAt - this.createdAt
    if (timeoutGap > 0) {
      this._timeoutTimer = globalThis.setTimeout(() => this._onRoomTimeout(), timeoutGap)
    } else {
      this._onRoomTimeout()
    }
  }

  private _doCleanTimer() {
    if (this._timeoutTimer) {
      globalThis.clearTimeout(this._timeoutTimer)
      this._timeoutTimer = void 0
    }
  }

  private _onRoomTimeout() {
    this.emit('timeout', this)
    this.close(1000, 'room timeout')
  }

  private _onCalleeClientSignalOpen = () => {
    // 清除超时定时器
    this._doCleanTimer()
    this.emit('connected', this)
  }

  private _onClientForwardMessage = <T>(message: Message<T>, client: ClientSession) => {
    if (client === this._callerClient) {
      this.forwardToCalleeClient(message)
    } else if (client === this._calleeClient) {
      this.forwardToCallerClient(message)
    }
  }

  private _onClientRTCServer = (message: WithRequired<Message<RTCServer>, 'id'>, client: ClientSession) => {
    const iceServers: RTCServerResponse = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ]
    client.sendRTCServers(message.id, iceServers)
  }

  private _onClientError = (err: Error) => {
    this.emit('error', err, this)
  }

  private _onClientSignalClose = (client: ClientSession) => {
    this.emit('disconnect', client, this)
    this.close(1000, 'client disconnect')
  }

  private _doBindCallerClientEvent = (client: ClientSession) => {
    client.on(MessageEvent.RTCOffer, this._onClientForwardMessage)
    client.on(MessageEvent.RTCAnswer, this._onClientForwardMessage)
    client.on(MessageEvent.RTCCandidate, this._onClientForwardMessage)
    client.on(MessageEvent.EndCall, this._onClientForwardMessage)
    client.on(MessageEvent.RTCServer, this._onClientRTCServer)
    client.on('error', this._onClientError)
    client.once('signal-close', this._onClientSignalClose)
    return () => {
      client.off(MessageEvent.RTCOffer, this._onClientForwardMessage)
      client.off(MessageEvent.RTCAnswer, this._onClientForwardMessage)
      client.off(MessageEvent.RTCCandidate, this._onClientForwardMessage)
      client.off(MessageEvent.EndCall, this._onClientForwardMessage)
      client.off(MessageEvent.RTCServer, this._onClientRTCServer)
      client.off('error', this._onClientError)
      client.off('signal-close', this._onClientSignalClose)
    }
  }

  setCallerClient(client: ClientSession) {
    if (this._callerClient) throw new Error('caller client already set')
    if (!this.caller.hasClient(client)) throw new Error('caller client not belongs to this room')
    this._doBindCallerClientEvent((this._callerClient = client))
  }

  private _doBindCalleeClientEvent = (client: ClientSession) => {
    client.on(MessageEvent.RTCOffer, this._onClientForwardMessage)
    client.on(MessageEvent.RTCAnswer, this._onClientForwardMessage)
    client.on(MessageEvent.RTCCandidate, this._onClientForwardMessage)
    client.on(MessageEvent.EndCall, this._onClientForwardMessage)
    client.on(MessageEvent.RTCServer, this._onClientRTCServer)
    client.on('error', this._onClientError)
    client.once('signal-open', this._onCalleeClientSignalOpen)
    client.once('signal-close', this._onClientSignalClose)
    return () => {
      client.off(MessageEvent.RTCOffer, this._onClientForwardMessage)
      client.off(MessageEvent.RTCAnswer, this._onClientForwardMessage)
      client.off(MessageEvent.RTCCandidate, this._onClientForwardMessage)
      client.off(MessageEvent.EndCall, this._onClientForwardMessage)
      client.off(MessageEvent.RTCServer, this._onClientRTCServer)
      client.off('error', this._onClientError)
      client.off('signal-open', this._onCalleeClientSignalOpen)
      client.off('signal-close', this._onClientSignalClose)
    }
  }

  setCalleeClient(client: ClientSession) {
    if (this._calleeClient) throw new Error('callee client already set')
    if (!this.callee.hasClient(client)) throw new Error('callee client not belongs to this room')
    this._doBindCalleeClientEvent((this._calleeClient = client))
  }

  getCallerClient() {
    return this._callerClient
  }

  getCalleeClient() {
    return this._calleeClient
  }

  forwardToCaller<T>(message: Message<T>) {
    this.caller.forwardToSignal(message)
  }

  forwardToCallee<T>(message: Message<T>) {
    this.callee.forwardToSignal(message)
  }

  forwardToCallerClient<T>(message: Message<T>) {
    this._callerClient?.sendToSignal(message)
  }

  forwardToCalleeClient<T>(message: Message<T>) {
    this._calleeClient?.sendToSignal(message)
  }

  close(code?: number, reason?: string) {
    if (this._isClosed) return
    this._isClosed = true

    this._doCleanTimer()
    const closeCode = code ?? 1000
    const closeReason = reason ?? 'room session close'

    // closeSignalSocket 会自动清理事件处理函数
    this._callerClient?.closeSignalSocket(closeCode, closeReason)
    this._callerClient = void 0

    // closeSignalSocket 会自动清理事件处理函数
    this._calleeClient?.closeSignalSocket(closeCode, closeReason)
    this._calleeClient = void 0

    this.emit('close', closeCode, closeReason, this)
    this.removeAllListeners()
  }

  [Symbol.dispose]() {
    this.close()
  }
}
