export interface Call {
  /** 通话类型，视频通话或者音频通话 */
  type: 'audio' | 'video'
  /** 发起方 */
  from: string | number
  /** 接收方 */
  to: string | number
  /** 房间 id */
  room?: string
}

export interface CancelCall {
  from: string | number
  to: string | number
  /** 用户掉线 ｜ 超时 | 接收方接了其他电话，忙碌中 ｜ 已在别的客户端处理 */
  reason?: 'offline' | 'timeout' | 'busy' | 'handled' | 'unknown'
}

export interface CallAnswer {
  /** 接受 ｜ 拒绝 ｜ 错过 */
  action: 'accept' | 'decline' | 'miss'
  /** 用户掉线 ｜ 忙碌，正在通话中 ｜ 超时 */
  reason?: 'offline' | 'busy' | 'timeout' | 'unknown'
  from: string | number
  to: string | number
  /** 房间 id */
  room?: string
}

export interface EndCall {
  from: string | number
  to: string | number
  /** 掉线 */
  reason?: 'offline'
}

export const CallType = Object.freeze({
  Audio: 'audio',
  Video: 'video',
})

export const CallAnswerAction = Object.freeze({
  Accept: 'accept',
  Decline: 'decline',
  Miss: 'miss',
})

export const DisconnectReason = Object.freeze({
  Offline: 'offline',
  Busy: 'busy',
  Timeout: 'timeout',
  Handled: 'handled',
  Unknown: 'unknown',
})
