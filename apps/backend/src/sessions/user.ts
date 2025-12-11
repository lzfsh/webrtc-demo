import EventEmitter from 'node:events'
import type { Call, CancelCall, Message } from '@demo/ws'
import { ClientSession, type ClientSessionOptions } from './client'

/** 事件回调参数加上 UserSession，是为了防止在绑定事件时出现函数嵌套调用，以便于清理回调 */
export interface UserSessionEvent {
  online: [UserSession]
  offline: [UserSession]
  error: [Error, UserSession]
  close: [number, string, UserSession]
}
export class UserSession extends EventEmitter<UserSessionEvent> {
  readonly id: string | number
  readonly createdAt: number = Date.now()

  /** NOTE: token -> ClientSession */
  private readonly _clients: Map<string, ClientSession> = new Map()

  /** 上一次检测是否在线 */
  private _wasOnline: boolean = this.isOnline
  /** 会话是否已经手动关闭，即调用 close 方法 */
  private _isClosed: boolean = false

  get isOnline() {
    return !this._isClosed && Array.from(this._clients.values()).some((client) => client.isOnline)
  }

  get inCall() {
    return !this._isClosed && Array.from(this._clients.values()).some((client) => client.inCall)
  }

  get isClosed() {
    return this._isClosed
  }

  constructor(id: string | number) {
    super()
    this.id = id
  }

  private _doEmitIfOnlineChanged() {
    if (this._wasOnline && !this.isOnline) {
      this.emit('offline', this)
      this._wasOnline = false
    }
    if (!this._wasOnline && this.isOnline) {
      this.emit('online', this)
      this._wasOnline = true
    }
  }

  private _doCleanClient(client: ClientSession) {
    // client.removeAllListeners()
    this._clients.delete(client.id)

    this._doEmitIfOnlineChanged()
  }

  /** 客户端状态改变（上线或者离线）时触发 */
  private _onClientStateChange = () => {
    this._doEmitIfOnlineChanged()
  }

  private _onClientError = (err: Error) => {
    this.emit('error', err, this)
  }

  private _onClientClose = (code: number, reason: string, client: ClientSession) => {
    this._doCleanClient(client)
  }

  private _doBindClientEvent(client: ClientSession) {
    client.on('online', this._onClientStateChange)
    client.on('offline', this._onClientStateChange)
    client.on('error', this._onClientError)
    client.once('close', this._onClientClose)
    return () => {
      client.off('online', this._onClientStateChange)
      client.off('offline', this._onClientStateChange)
      client.off('error', this._onClientError)
      client.off('close', this._onClientClose)
    }
  }

  setClient(clientId: string, opts: Omit<ClientSessionOptions, 'owner'>): void
  setClient(client: ClientSession): void
  setClient(input: string | ClientSession, opts?: Omit<ClientSessionOptions, 'owner'>): void {
    if (this._isClosed) return

    let clientToSet: ClientSession, exist: ClientSession | undefined
    if (typeof input === 'string') {
      exist = this._clients.get(input)
      if (!opts) throw new Error('opts are required when providing only a Id')
      clientToSet = new ClientSession(input, { owner: this.id, ...opts })
    } else {
      if (input.owner !== this.id) throw new Error('client owner must be the same as user id')
      exist = this._clients.get(input.id)
      if (exist === input) return
      clientToSet = input
    }

    if (exist) {
      exist.close(1000, 'user session replace')
    }

    // 事件绑定
    this._doBindClientEvent(clientToSet)
    this._clients.set(clientToSet.id, clientToSet)
    this._doEmitIfOnlineChanged()
  }

  closeClient(clientId: string, code?: number, reason?: string): void
  closeClient(client: ClientSession, code?: number, reason?: string): void
  closeClient(input: string | ClientSession, code?: number, reason?: string) {
    let clientToClose: ClientSession | undefined
    if (typeof input === 'string') {
      clientToClose = this._clients.get(input)
    } else {
      if (input.owner !== this.id) throw new Error('client owner must be the same as user id')
      if (this._clients.get(input.id) === input) {
        clientToClose = input
      }
    }
    if (clientToClose) {
      clientToClose.close(code, reason)
    }
  }

  hasClient(clientId: string): boolean
  hasClient(client: ClientSession): boolean
  hasClient(input: string | ClientSession): boolean {
    if (typeof input === 'string') {
      return this._clients.has(input)
    } else {
      return this._clients.get(input.id) === input
    }
  }

  getClient(clientId: string) {
    return this._clients.get(clientId)
  }

  getClientInCall() {
    return Array.from(this._clients.values()).find((client) => client.inCall)
  }

  forward<T>(message: Message<T>, opts: { exclude?: string | string[] } = {}) {
    if (this.isClosed) return
    const exclude = Array.isArray(opts.exclude) ? opts.exclude : opts.exclude ? [opts.exclude] : []
    this._clients.forEach((client) => {
      if (client.isOnline && !exclude.includes(client.id)) client.send(message)
    })
  }

  forwardToSignal<T>(message: Message<T>, opts: { exclude?: string | string[] } = {}) {
    if (this.isClosed) return
    const exclude = Array.isArray(opts.exclude) ? opts.exclude : opts.exclude ? [opts.exclude] : []
    this._clients.forEach((client) => {
      if (client.isOnline && !exclude.includes(client.id)) client.sendToSignal(message)
    })
  }

  forwardExclude<T>(message: Message<T>, ...clientIds: string[]) {
    this.forward(message, { exclude: clientIds })
  }

  forwardTo<T>(message: Message<T>, ...clientIds: string[]) {
    if (this.isClosed) return
    clientIds.forEach((id) => {
      const client = this._clients.get(id)
      if (client?.isOnline) client.send(message)
    })
  }

  forwardInComingCall(payload: Omit<Call, 'to'>, opts: { exclude?: string | string[] } = {}) {
    if (this.isClosed) return
    const exclude = Array.isArray(opts.exclude) ? opts.exclude : opts.exclude ? [opts.exclude] : []
    this._clients.forEach((client) => {
      if (client.isOnline && !exclude.includes(client.id)) client.notifyIncomingCall(payload)
    })
  }

  forwardCallCancelled(payload: Omit<CancelCall, 'to'>, opts: { exclude?: string | string[] } = {}) {
    if (this.isClosed) return
    const exclude = Array.isArray(opts.exclude) ? opts.exclude : opts.exclude ? [opts.exclude] : []
    this._clients.forEach((client) => {
      if (client.isOnline && !exclude.includes(client.id)) client.notifyCallCancelled(payload)
    })
  }

  close(code?: number, reason?: string) {
    if (this._isClosed) return
    this._isClosed = true

    const closeCode = code ?? 1000
    const closeReason = reason ?? 'user session close'
    for (const client of Array.from(this._clients.values())) {
      client.close(closeCode, closeReason)
    }

    this.emit('close', closeCode, closeReason, this)
    this.removeAllListeners()
  }

  [Symbol.dispose]() {
    this.close()
  }
}
