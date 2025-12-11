import { useEffect } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { Connect, Env, RoutePath } from '@/configs'
import { TypedEvent } from '@/utils'
import { WebSocketClient, type WebSocketEvent, WSEvent } from './websocket-client'
import { useAuthStore } from '@/stores'
import {
  MessageEvent,
  JSONSerializer,
  Packager,
  CallType,
  type Message,
  type CallAnswer,
  type Call,
  type CancelCall,
  type EndCall,
  type RTCAnswer,
  type RTCCandidate,
  type RTCOffer,
  type RTCServerResponse,
  type WithRequired,
  type RTCServer,
  type Serializer,
} from '@demo/ws'

export type WebSocketServiceEvent = WebSocketEvent & {
  // [MessageEvent.Ping]: (message: Message) => void
  [MessageEvent.Pong]: (message: Message) => void

  [MessageEvent.Call]: (message: WithRequired<Message<Call>, 'payload'>) => void
  [MessageEvent.CallAnswer]: (message: WithRequired<Message<CallAnswer>, 'payload'>) => void

  [MessageEvent.CancelCall]: (message: WithRequired<Message<CancelCall>, 'payload'>) => void
  [MessageEvent.EndCall]: (message: WithRequired<Message<EndCall>, 'payload'>) => void

  [MessageEvent.RTCOffer]: (message: WithRequired<Message<RTCOffer>, 'payload'>) => void
  [MessageEvent.RTCAnswer]: (message: WithRequired<Message<RTCAnswer>, 'payload'>) => void
  [MessageEvent.RTCCandidate]: (message: WithRequired<Message<RTCCandidate>, 'payload'>) => void

  // [MessageEvent.RTCServer]: (message: WithRequired<Message<RTCServer>, 'id'>) => void
  [MessageEvent.RTCServerResponse]: (message: Required<Message<RTCServerResponse>>) => void
}

export const WebSocketSrvEvent = Object.freeze({
  ...WSEvent,
  ...MessageEvent,
})

export class WebSocketService extends TypedEvent<WebSocketServiceEvent> {
  // 单例模式，只做一次连接
  private static _ins?: WebSocketService
  static getInstance() {
    return (this._ins ??= new WebSocketService())
  }

  static readonly TIMEOUT = 10000
  static getURL(token?: string, roomId?: string) {
    const searchParams = new URLSearchParams()
    if (token) searchParams.append('token', token)
    if (roomId) searchParams.append('room', roomId)
    const qs = searchParams.toString()
    return `${Env.WS_PREFIX}${qs ? `?${qs}` : ''}`
  }

  private _idx: number = 0
  private _from?: string | number
  private _defers: TypedEvent<Record<string | number, (message: Required<Message>) => void>> = new TypedEvent()
  private _serializer: Serializer = JSONSerializer

  private _client?: WebSocketClient

  private constructor() {
    super()
  }

  private _generateId() {
    return `${this._idx++}`
  }

  /**
   * 用自动生成的 id，注册一个等待并处理 ws 响应消息的回调函数。通过 ws 响应消息的字段 id 匹配并执行回调，不匹配 event 字段，具体触发逻辑在 connect 方法中。
   * @param executor 接收一个 id 作为参数的执行函数，用来发送一条携带 id 字段的 ws 请求消息
   * @param opts.timeout 超时时间，默认 10s，如果在发送 ws 消息后，超过这个时间未收到响应，则注销回调并返回一个 Timeout 的 Promise 错误
   */
  private _defer<T>(executor: (id: string | number) => void, opts: { timeout?: number }) {
    return new Promise<Required<Message<T>>>((resolve, reject) => {
      try {
        const options = { ...{ timeout: WebSocketService.TIMEOUT }, ...opts }
        const id = this._generateId()
        executor(id)

        const callback = (message: Required<Message<T>>) => {
          window.clearTimeout(timer)
          if (message.id === id) {
            resolve(message)
          } else {
            reject(new Error(`Incorrect message: ${JSON.stringify(message)}`))
          }
        }

        const timer = window.setTimeout(() => {
          this._defers.off(id, callback)
          reject(new Error('Timeout'))
        }, options.timeout)

        this._defers.once(id, callback)
      } catch (err) {
        reject(err)
      }
    })
  }

  private _onOpen = (e: Event) => {
    this.emit('open', e)
  }

  private _onMessage = (e: MessageEvent) => {
    const message = this._serializer.deserialize<Message>(e.data)
    this.emit(message.event as any, message as any)
    if (message.id) {
      this._defers.emit(message.id, message as Required<Message>)
    }
  }

  private _onError = (e: Event) => {
    this.emit('error', e)
  }

  private _onClose = (e: CloseEvent) => {
    this.emit('close', e)
    this._client = void 0
  }

  private _bindEvent(socket: WebSocketClient) {
    socket.onopen = this._onOpen
    socket.onmessage = this._onMessage
    socket.onerror = this._onError
    socket.onclose = this._onClose
    return () => {
      socket.onopen = null
      socket.onmessage = null
      socket.onerror = null
      socket.onclose = null
    }
  }

  connect(url: string) {
    if (!this._from) throw new Error('From userId is not set')

    const client = new WebSocketClient(url, {
      ping: () => this._serializer.serialize(Packager.preparePing()),
      pong: () => this._serializer.serialize(Packager.preparePong()),
    })
    this._bindEvent((this._client = client))
  }

  setFrom(userId: string | number) {
    this._from = userId
  }

  ping() {
    this.send(Packager.preparePing())
  }

  pong() {
    this.send(Packager.preparePong())
  }

  forwardCall(to: Call['to'], type: Call['type'] = CallType.Audio) {
    this.send(Packager.prepareCall({ from: this._from!, to, type }))
  }

  /** 拨出视频电话 */
  forwardVideoCall(to: Call['to']) {
    this.send(Packager.prepareVideoCall({ from: this._from!, to }))
  }

  /** 拨出音频电话 */
  forwardAudioCall(to: Call['to']) {
    this.send(Packager.prepareAudioCall({ from: this._from!, to }))
  }

  /** 取消拨出电话 */
  forwardCallCancelled(to: CancelCall['to']) {
    this.send(Packager.prepareCancelCall({ from: this._from!, to }))
  }

  /** 接听拨入电话 */
  forwardCallAccepted(to: CallAnswer['to']) {
    this.send(Packager.prepareAcceptCall({ from: this._from!, to }))
  }

  /** 拒绝拨入电话 */
  forwardCallDeclined(to: CallAnswer['to']) {
    this.send(Packager.prepareDeclineCall({ from: this._from!, to }))
  }

  forwardCallEnd(to: EndCall['to']) {
    this.send(Packager.prepareEndCall({ from: this._from!, to }))
  }
  
  forwardRTCOffer(sdp: RTCOffer['sdp'], to: RTCOffer['to']) {
    this.send(Packager.prepareRTCOffer({ from: this._from!, to, sdp }))
  }

  forwardRTCAnswer(sdp: RTCAnswer['sdp'], to: RTCAnswer['to']) {
    this.send(Packager.prepareRTCAnswer({ from: this._from!, to, sdp }))
  }

  forwardRTCCandidate(candidate: RTCCandidate['candidate'], to: RTCCandidate['to']) {
    this.send(Packager.prepareRTCCandidate({ from: this._from!, to, candidate }))
  }

  getRTCServers(payload: RTCServer = {}, opts: { timeout?: number } = {}) {
    return this._defer<RTCServerResponse>((id) => this.send(Packager.prepareRTCServer(id, payload)), opts)
  }

  send<T>(message: Message<T>) {
    this._client?.send(this._serializer.serialize(message))
  }

  close() {
    this._client?.close()
  }
}

export function useWebSocketService() {
  const { pathname } = useLocation()
  const { token, user } = useAuthStore()
  const [searchParams] = useSearchParams()

  const instance = WebSocketService.getInstance()
  let room: string | undefined
  if (pathname === RoutePath.Connect) {
    room = Connect.parseSearchParams(searchParams).room
  }

  useEffect(() => {
    if (token && user) {
      instance.setFrom(user.id)
      let url
      if (pathname === RoutePath.Connect) {
        url = WebSocketService.getURL(token, room)
      } else if (pathname === RoutePath.Home) {
        url = WebSocketService.getURL(token)
      }
      if (url) instance.connect(url)
    }
    return () => {
      if (token && user) instance.close()
    }
  }, [instance, token, user, pathname, room])

  return instance
}
