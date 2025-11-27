import { WebSocket } from 'ws'

type Message = Parameters<WebSocket['send']>[0]
type EvtName = keyof WebSocket.WebSocketEventMap

export interface ClientSessionOptions {
  owner?: string | number
  /** 在多少时间后客户端失活（离线），单位毫秒，初始化时会配置为 ws 心跳时间（conf.server.websocket.heartbeat (20s)）的 3 倍 */
  inactiveIn: number
  /** 在多少时间后会话过期，过期后会自动从会话管理器中移除，单位毫秒，初始化时会配置为 jwt 有效期（conf.server.auth.expiresIn (7d)） */
  expireIn: number
}

/** ws 客户端会话 */
export class ClientSession {
  /** 客户端 token，用 token 当 id */
  readonly id: string
  /** 所属用户 ID */
  readonly owner?: string | number
  /** 最后活跃时间（毫秒时间戳） */
  lastActiveAt: number
  /** 在多少时间后客户端失活（离线），单位毫秒 */
  readonly inactiveIn: number
  /** 过期时间（毫秒时间戳） */
  readonly expireAt: number
  private readonly _sockets: Set<WebSocket> = new Set()
  private readonly _socketToEvtCb: WeakMap<WebSocket, [EvtName, (...args: any[]) => any][]> = new WeakMap()
  private readonly _cachedMsgs: WeakMap<WebSocket, Set<Message>> = new WeakMap()

  private _doOff(socket: WebSocket, evt?: string, callback?: (...args: any[]) => any) {
    if (!this._socketToEvtCb.has(socket)) return

    const newEvtCbs: [EvtName, (...args: any[]) => any][] = []
    for (const [e, cb] of this._socketToEvtCb.get(socket)!) {
      if ((!evt || e === evt) && (!callback || cb === callback)) {
        socket.off(e, cb)
      } else {
        newEvtCbs.push([e, cb])
      }
    }
    if (newEvtCbs.length === 0) {
      this._socketToEvtCb.delete(socket)
    } else {
      this._socketToEvtCb.set(socket, newEvtCbs)
    }
  }

  private _doClean(socket: WebSocket) {
    this._doOff(socket)
    this._cachedMsgs.delete(socket)
    this._sockets.delete(socket)
  }

  private _doClose(socket: WebSocket) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.close()
    }
  }

  constructor(id: string, opts: ClientSessionOptions) {
    this.id = id
    this.owner = opts.owner

    const now = Date.now()
    this.lastActiveAt = now
    this.expireAt = now + opts.expireIn
    this.inactiveIn = opts.inactiveIn
  }

  isSessionActive(now: number = Date.now()) {
    return this.lastActiveAt + this.inactiveIn > now
  }

  isSessionExpired(now: number = Date.now()) {
    return this.expireAt <= now
  }

  active() {
    this.lastActiveAt = Date.now()
  }

  hasSocket(socket: WebSocket) {
    return this._sockets.has(socket)
  }

  /** 添加 socket 连接，处于关闭或者关闭中状态的 socket 连接不会被添加 */
  addSocket(socket: WebSocket) {
    if (([WebSocket.CLOSED, WebSocket.CLOSING] as number[]).includes(socket.readyState)) return
    if (this._sockets.has(socket)) return

    this._sockets.add(socket)

    // socket 关闭时，移除 socket 连接
    const onclose = () => {
      this._doClean(socket)
    }
    // socket 连接打开时，发送缓存消息
    const onopen = () => {
      this._doOff(socket, 'open', onopen)

      if (this._cachedMsgs.has(socket)) {
        for (const msg of this._cachedMsgs.get(socket)!) {
          socket.send(msg)
        }
        this._cachedMsgs.delete(socket)
      }
    }
    // socket 收到消息时，更新活跃时间
    const onmessage = (data: WebSocket.RawData, isBinary: boolean) => {
      console.log(data, isBinary)
      // TODO 改消息体
      if (data.toString().replace(/\s+/gm, '') === 'ping') {
        socket.send('pong')
        this.active()
      }

      // TODO 其他业务代码
    }
    socket.once('close', onclose)
    socket.once('open', onopen)
    socket.on('message', onmessage)
    this._socketToEvtCb.set(socket, [
      ['close', onclose],
      ['open', onopen],
      ['message', onmessage],
    ])
  }

  getAllSocket() {
    return Array.from(this._sockets)
  }

  /** 移除 socket 连接 */
  removeSocket(socket: WebSocket) {
    this._doClean(socket)
    this._doClose(socket)
  }

  removeAllSocket() {
    for (const socket of Array.from(this._sockets)) {
      this._doClose(socket)
      this._doClean(socket)
    }
    this._sockets.clear()
  }

  close() {
    this.removeAllSocket()
  }

  [Symbol.dispose]() {
    this.close()
  }

  /** 向所有 socket 连接发送消息 */
  sendToAllSocket(msg: Message) {
    for (const socket of Array.from(this._sockets)) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(msg)
      } else if (socket.readyState === WebSocket.CONNECTING) {
        // 缓存消息，socket 连接打开时发送
        const cachedMsgs = this._cachedMsgs.get(socket) || new Set<Message>()
        cachedMsgs.add(msg)
        this._cachedMsgs.set(socket, cachedMsgs)
      }
    }
  }
}

export class UserSession {
  readonly id: string | number
  private readonly _clients: Map<string, ClientSession> = new Map()

  /** 客户端没有过期，返回客户端，否则释放 socket 连接，且从客户端列表中移除 */
  private _doIfExpired(client?: ClientSession, now: number = Date.now()) {
    if (!client) return
    if (!client.isSessionExpired(now)) return client
    this._doClean(client)
  }

  private _doClean(client?: ClientSession) {
    if (!client) return
    client.close()
    this._clients.delete(client.id)
  }

  constructor(id: string | number) {
    this.id = id
  }

  isOnline() {
    return this.countActiveClient() > 0
  }

  hasClient(client: ClientSession): boolean
  hasClient(id: string): boolean
  hasClient(arg: any): boolean {
    return arg instanceof ClientSession ? this._clients.has(arg.id) : this._clients.has(arg)
  }

  setClient(client: ClientSession) {
    // 先删除旧的客户端会话
    if (this.hasClient(client)) this._doClean(client)
    this._clients.set(client.id, client)
  }

  /** 获取指定客户端会话，如果客户端会话过期了，删除客户端会话，并返回 undefined */
  getClient(id: string) {
    return this._doIfExpired(this._clients.get(id))
  }

  /** 获取所有未过期的客户端会话 */
  getAllClient() {
    const now = Date.now()
    const clients: ClientSession[] = []
    for (const client of Array.from(this._clients.values())) {
      if (!this._doIfExpired(client, now)) clients.push(client)
    }
    return clients
  }

  /** 获取所有活跃客户端会话 */
  getActiveClient() {
    const now = Date.now()
    return this.getAllClient().filter((client) => client.isSessionActive(now))
  }

  /** 获取未过期的客户端会话数量 */
  countClient() {
    return this.getAllClient().length
  }

  /** 获取活跃客户端会话数量 */
  countActiveClient() {
    return this.getActiveClient().length
  }

  cleanClient() {
    const now = Date.now()
    for (const client of Array.from(this._clients.values())) {
      this._doIfExpired(client, now)
    }
  }

  removeClient(id: string) {
    this._doClean(this._clients.get(id))
  }

  removeAllClient() {
    for (const client of Array.from(this._clients.values())) {
      this._doClean(client)
    }
    this._clients.clear()
  }

  [Symbol.dispose]() {
    this.removeAllClient()
  }

  /** 向所有活跃客户端会话发送消息 */
  sendToAllClient(msg: Message) {
    for (const client of this.getAllClient()) {
      if (client.isSessionActive()) client.sendToAllSocket(msg)
    }
  }

  /** 向指定活跃客户端会话发送消息，如果客户端会话过期了，不发送消息 */
  sendToClient(id: string, msg: Message) {
    const client = this.getClient(id)
    if (client?.isSessionActive()) client.sendToAllSocket(msg)
  }
}

export interface CreateUserSessionOptions extends Omit<ClientSessionOptions, 'owner'> {
  id: string | number
  token: string
}
/** 用户会话管理器 */
export class SessionManager {
  private readonly _users: Map<string | number, UserSession> = new Map()

  hasUser(user: UserSession): boolean
  hasUser(id: string | number): boolean
  hasUser(arg: any): boolean {
    return arg instanceof UserSession ? this._users.has(arg.id) : this._users.has(arg)
  }

  setUser(user: UserSession) {
    // 先删除旧的用户会话
    if (this.hasUser(user)) this.removeUser(user.id)
    this._users.set(user.id, user)
  }

  /** 获取指定用户会话 */
  getUser(id: string | number) {
    return this._users.get(id)
  }

  getAllUser() {
    return Array.from(this._users.values())
  }

  removeUser(id: string | number) {
    const user = this._users.get(id)
    if (user) user.removeAllClient()
    this._users.delete(id)
  }

  removeAllUser() {
    for (const user of Array.from(this._users.values())) {
      user.removeAllClient()
    }
    this._users.clear()
  }

  [Symbol.dispose]() {
    this.removeAllUser()
  }

  createUserSession(opts: CreateUserSessionOptions) {
    const user = this.getUser(opts.id) ?? new UserSession(opts.id)
    user.setClient(new ClientSession(opts.token, { owner: user.id, ...opts }))
    if (!this.hasUser(user)) this.setUser(user)
  }

  removeUserSession(id: string | number, token: string) {
    const user = this.getUser(id)
    if (!user) return

    user.removeClient(token)
    // 如果用户会话没有客户端会话或者客户端会话都过期了，删除用户会话
    if (user?.countClient() === 0) {
      this.removeUser(id)
    }
  }
}

export function createSessionManager(...args: ConstructorParameters<typeof SessionManager>) {
  return new SessionManager(...args)
}
