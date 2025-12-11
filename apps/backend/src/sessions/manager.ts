import {
  MessageEvent,
  DisconnectReason,
  CallAnswerAction,
  type Call,
  type Message,
  type WithRequired,
  type CancelCall,
  type CallAnswer,
} from '@demo/ws'
import { ClientSession, type ClientSessionOptions } from './client'
import { RoomSession, type RoomSessionOptions } from './room'
import { UserSession } from './user'

export class SessionManager {
  private _nextRoomId = 0
  /** NOTE: userId -> UserSession */
  private readonly _users: Map<string | number, UserSession> = new Map()
  /** NOTE: roomId -> RoomSession */
  private readonly _rooms: Map<string, RoomSession> = new Map()

  private _doCleanUser(user: UserSession) {
    // user.removeAllListeners()
    this._users.delete(user.id)
  }

  private _doCleanRoom(room: RoomSession) {
    // room.removeAllListeners()
    this._rooms.delete(room.id)
  }

  private _onError = (err: Error) => {
    // 日志 log
    console.error(err.message)
  }

  private _onClientPing = (message: Message, client: ClientSession) => {
    client.pong()
  }

  private _onClientCall = (message: WithRequired<Message<Call>, 'payload'>, callerClient: ClientSession) => {
    const { from: callerId, to: calleeId, type } = message.payload
    const callee = this.getUser(calleeId)
    if (!callee || !callee?.isOnline) {
      callerClient.notifyCallMissed({ from: calleeId, reason: DisconnectReason.Offline })
      return
    }
    // 如果用户正在呼叫或者这在通话中，提示忙碌
    if (this.hasRoomWithCallerId(callee.id)) {
      callerClient.notifyCallMissed({ from: calleeId, reason: DisconnectReason.Busy })
      return
    }

    // 创建房间，设置发起方 caller 客户端
    const room = this.createRoom(callerId, calleeId, { type })
    room.setCallerClient(callerClient)

    const onCallerClientOffline = () => {
      // 发起方 caller 客户端掉线了，如果不在通话中，通知接听方 callee 由于拨打方 caller 客户端掉线而通话取消
      if (!room.inCall) callee.forwardCallCancelled({ from: callerId, reason: DisconnectReason.Offline })
      room.close(1000, 'caller client offline')
    }
    const onCalleeOffline = () => {
      // 接收方 callee 掉线了，如果不在通话中，通知发起方 caller 客户端由于接收方 callee 掉线而错过通话
      if (!room.inCall) callerClient.notifyCallMissed({ from: calleeId, reason: DisconnectReason.Offline })
      room.close(1000, 'callee offline')
    }
    callerClient.once('offline', onCallerClientOffline)
    callee.once('offline', onCalleeOffline)
    room.once('timeout', () => {
      // 通话超时，通知发起方 caller 客户端通话超时而错过通话，同时通知接听方 callee 客户端通话取消
      if (!room.inCall) {
        callerClient.notifyCallMissed({ from: calleeId, reason: DisconnectReason.Timeout })
        callee.forwardCallCancelled({ from: callerId, reason: DisconnectReason.Timeout })
      }
    })
    // 通话结束时，移除事件处理函数
    room.once('close', () => {
      callerClient.removeListener('offline', onCallerClientOffline)
      callee.removeListener('offline', onCalleeOffline)
    })

    callee.forwardInComingCall({ type, from: callerId, room: room.id })
  }

  private _onClientCancelCall = (message: WithRequired<Message<CancelCall>, 'payload'>) => {
    const { from: callerId, to: calleeId } = message.payload
    const room = this.getRoomByIds(callerId, calleeId)
    if (!room) return
    if (room.callee.isOnline) room.callee.forward(message)
    room.close(1000, 'call cancelled')
  }

  private _onClientCallAnswer = (
    message: WithRequired<Message<CallAnswer>, 'payload'>,
    calleeClient: ClientSession,
  ) => {
    const { from: calleeId, to: callerId, action } = message.payload
    const room = this.getRoomByIds(callerId, calleeId)
    const callerClient = room?.getCallerClient()
    if (!room || !callerClient) return
    switch (action) {
      case CallAnswerAction.Accept: {
        callerClient.notifyCallAccepted({ from: calleeId, room: room.id })
        room.setCalleeClient(calleeClient)
        // 通知接听方的其他客户端，通话已接听
        room.callee.forwardCallCancelled(
          { from: callerId, reason: DisconnectReason.Handled },
          { exclude: calleeClient.id },
        )
        // 找到其他正在等待接收方 callee 接听的房间
        const rooms = this.getRoomsByCalleeId(calleeId).filter((r) => r.caller.id !== callerId)
        // 1. 通知其他发起方客户端接收方 callee 用户已在通话中（忙碌）
        // 2. 通知其他接收方所有客户端，因为接收方正在通话（忙碌），取消接听其他来电
        // 3. 关闭房间
        rooms.forEach((r) => {
          const callerClient = r.getCallerClient()
          if (callerClient) {
            callerClient?.notifyCallMissed({ from: calleeId, reason: DisconnectReason.Busy })
            r.callee.forwardCallCancelled({ from: callerClient.owner, reason: DisconnectReason.Busy })
          }
          r.close(1000, 'callee busy')
        })
        // 通话结束时，向通话中的其他客户端通知通话已结束
        room.on('disconnect', (client) => {
          if (client === callerClient) {
            calleeClient.notifyCallEnd({ from: callerId, reason: DisconnectReason.Offline })
          } else if (client === calleeClient) {
            callerClient.notifyCallEnd({ from: calleeId, reason: DisconnectReason.Offline })
          }
        })
        break
      }
      case CallAnswerAction.Decline:
        callerClient.notifyCallDeclined({ from: calleeId })
        room.callee.forwardCallCancelled(
          { from: callerId, reason: DisconnectReason.Handled },
          { exclude: calleeClient.id },
        )
        room.close(1000, 'call declined')
        break
      default:
        callerClient.notifyCallMissed({ from: calleeId, reason: DisconnectReason.Unknown })
        room.close(1000, 'unknown')
        break
    }
  }

  private _doBindClientEvent(client: ClientSession) {
    client.on(MessageEvent.Ping, this._onClientPing)
    client.on(MessageEvent.Call, this._onClientCall)
    client.on(MessageEvent.CancelCall, this._onClientCancelCall)
    client.on(MessageEvent.CallAnswer, this._onClientCallAnswer)
    return () => {
      client.off(MessageEvent.Ping, this._onClientPing)
      client.off(MessageEvent.Call, this._onClientCall)
      client.off(MessageEvent.CancelCall, this._onClientCancelCall)
      client.off(MessageEvent.CallAnswer, this._onClientCallAnswer)
    }
  }

  createClientIfNotExist(id: string | number, token: string, opts: Omit<ClientSessionOptions, 'owner'>) {
    let user = this.getUser(id)
    if (!user) {
      user = new UserSession(id)
      this.setUser(user)
    }

    let client = user.getClient(token)
    if (!client) {
      client = new ClientSession(token, { owner: id, ...opts })
      this._doBindClientEvent(client)
      user.setClient(client)
    }
    return client
  }

  closeClient(id: string | number, token: string, code?: number, reason?: string) {
    const user = this.getUser(id)
    if (!user) return
    user.closeClient(token, code, reason)
  }

  hasClient(id: string | number, token: string) {
    const user = this.getUser(id)
    if (!user) return false
    return user.hasClient(token)
  }

  getClient(id: string | number, token: string) {
    const user = this.getUser(id)
    if (!user) return
    return user.getClient(token)
  }

  private _onUserOffline = (user: UserSession) => {
    user.close(1000, 'user offline')
  }

  private _onUserClose = (code: number, reason: string, user: UserSession) => {
    this._doCleanUser(user)
  }

  private _doBindUserEvent(user: UserSession) {
    user.once('offline', this._onUserOffline)
    user.on('error', this._onError)
    user.once('close', this._onUserClose)
    return () => {
      user.off('offline', this._onUserOffline)
      user.off('error', this._onError)
      user.off('close', this._onUserClose)
    }
  }

  setUser(user: UserSession) {
    const exist = this._users.get(user.id)
    if (exist === user) return
    if (exist) {
      exist.close(1000, 'session manager replace')
    }
    this._doBindUserEvent(user)
    this._users.set(user.id, user)
  }

  closeUser(userId: string | number, code?: number, reason?: string): void
  closeUser(user: UserSession, code?: number, reason?: string): void
  closeUser(input: string | number | UserSession, code?: number, reason?: string) {
    let userToClose: UserSession | undefined
    if (typeof input === 'string' || typeof input === 'number') {
      userToClose = this._users.get(input)
    } else if (input instanceof UserSession && this._users.get(input.id) === input) {
      userToClose = input
    }
    if (userToClose) {
      userToClose.close(code, reason)
    }
  }

  hasUser(userId: string | number): boolean
  hasUser(user: UserSession): boolean
  hasUser(input: string | number | UserSession) {
    if (typeof input === 'string' || typeof input === 'number') {
      return this._users.has(input)
    } else {
      return this._users.get(input.id) === input
    }
  }

  getUser(userId: string | number) {
    return this._users.get(userId)
  }

  private _onRoomClose = (code: number, reason: string, room: RoomSession) => {
    this._doCleanRoom(room)
  }

  private _doBindRoomEvent(room: RoomSession) {
    room.on('error', this._onError)
    room.once('close', this._onRoomClose)
    return () => {
      room.off('error', this._onError)
      room.off('close', this._onRoomClose)
    }
  }

  setRoom(room: RoomSession) {
    const exist = this._rooms.get(room.id)
    if (exist === room) return
    if (exist) {
      exist.close(1000, 'session manager replace')
    }
    this._doBindRoomEvent(room)
    this._rooms.set(room.id, room)
  }

  createRoom(callerId: string | number, calleeId: string | number, opts: RoomSessionOptions = {}) {
    const exist = this.getRoomByIds(callerId, calleeId)
    if (exist) exist.close(1000, 'same room')

    const caller = this.getUser(callerId)
    const callee = this.getUser(calleeId)
    if (!caller?.isOnline || !callee?.isOnline) throw new Error('caller or callee is offline')

    const roomId = `${callerId}-${calleeId}-${this._nextRoomId++}`

    const room = new RoomSession(roomId, caller, callee, opts)
    this.setRoom(room)
    return room
  }

  closeRoom(roomId: string, code?: number, reason?: string): void
  closeRoom(room: RoomSession, code?: number, reason?: string): void
  closeRoom(input: string | RoomSession, code?: number, reason?: string) {
    let roomToClose: RoomSession | undefined
    if (typeof input === 'string') {
      roomToClose = this._rooms.get(input)
    } else if (input instanceof RoomSession && this._rooms.get(input.id) === input) {
      roomToClose = input
    }
    if (roomToClose) {
      roomToClose.close(code, reason)
    }
  }

  hasRoom(roomId: string): boolean
  hasRoom(room: RoomSession): boolean
  hasRoom(input: string | RoomSession) {
    if (typeof input === 'string') {
      return this._rooms.has(input)
    } else {
      return this._rooms.get(input.id) === input
    }
  }

  hasRoomWithIds(callerId: string | number, calleeId: string | number): boolean {
    return !!this.getRoomByIds(callerId, calleeId)
  }

  hasRoomWithCallerId(callerId: string | number): boolean {
    return this.getRoomsByCallerId(callerId).length > 0
  }

  hasRoomWithCalleeId(calleeId: string | number): boolean {
    return this.getRoomsByCalleeId(calleeId).length > 0
  }

  getRoom(roomId: string) {
    return this._rooms.get(roomId)
  }

  getRoomByIds(callerId: string | number, calleeId: string | number) {
    return Array.from(this._rooms.values()).find((room) => room.caller.id === callerId && room.callee.id === calleeId)
  }

  getRoomsByCalleeId(calleeId: string | number) {
    return Array.from(this._rooms.values()).filter((room) => room.callee.id === calleeId)
  }

  getRoomsByCallerId(callerId: string | number) {
    return Array.from(this._rooms.values()).filter((room) => room.caller.id === callerId)
  }

  close() {
    Array.from(this._rooms.values()).forEach((room) => room.close(1000, 'manager close'))
    Array.from(this._users.values()).forEach((user) => user.close(1000, 'manager close'))
    this._nextRoomId = 0
  }

  [Symbol.dispose]() {
    this.close()
  }
}

export function createSessionManager(...args: ConstructorParameters<typeof SessionManager>) {
  return new SessionManager(...args)
}
