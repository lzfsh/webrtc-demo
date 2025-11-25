/** 用户客户端，当过期时间 expireAt 小于当前时间时，被认为是用户客户端不在线 */
export interface Client {
  /** 客户端ID */
  // id: string | number
  // /** 平台 */
  // platform: string
  /** 所属用户ID */
  owner: string | number
  /** 客户端 token */
  token: string
  /** 最后活跃时间 */
  lastActiveAt: number
  /** 过期时间 */
  expireAt: number
  /** 删除时间 */
  deleteAt: number
}

export interface ClientSessionOptions {
  /** 客户端在线状态有效期，单位毫秒，初始化时会配置为 ws 心跳时间（conf.server.websocket.heartbeat (20s)）的 3 倍 */
  expiresIn: number
  /** 客户端状态过期后保留的有效期，单位毫秒，初始化时会配置为 token 的有效期（conf.server.auth.expiresIn (7d)） */
  retainsIn: number
}

export class ClientSession {
  private _clients: Map<string | number, Client> = new Map()
  private _options: ClientSessionOptions

  constructor(opts: ClientSessionOptions) {
    this._options = opts
  }

  /** 添加用户客户端 */
  add(userID: string | number, client: Omit<Client, 'lastActiveAt' | 'expireAt' | 'deleteAt' | 'owner'>) {
    const now = Date.now()
    this._clients.set(userID, {
      ...client,
      owner: userID,
      lastActiveAt: now,
      expireAt: now + this._options.expiresIn,
      deleteAt: now + this._options.retainsIn,
    })
  }

  /** 获取用户客户端，当用户客户端未注册时，或者用户客户端过期时，不返回客户端信息 */
  get(id: string | number) {
    const client = this._clients.get(id)
    // 用户客户端，当过期时间 expireAt 小于当前时间时，被认为是用户客户端不在线
    if (client && client.expireAt > Date.now()) return client
    // 当删除时间 deleteAt 小于当前时间时，删除用户客户端
    if (client && client.deleteAt <= Date.now()) this._clients.delete(id)
  }

  /** 删除用户客户端 */
  remove(userID: string | number) {
    this._clients.delete(userID)
  }

  /** 刷新用户客户端过期时间 */
  refresh(userID: string | number) {
    const client = this._clients.get(userID)
    if (client) {
      const now = Date.now()
      client.lastActiveAt = now
      client.expireAt = now + this._options.expiresIn
      client.deleteAt = now + this._options.retainsIn
    }
  }

  /** 清除所有用户客户端 */
  clear() {
    this._clients.clear()
  }
}

export function createClientSession(...args: ConstructorParameters<typeof ClientSession>) {
  return new ClientSession(...args)
}
