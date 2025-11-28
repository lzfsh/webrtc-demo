/** 发送通话请求 */
export interface PeerCallRequest {
  /** 通话类型，视频通话或者音频通话 */
  type: 'audio' | 'video'
  /** 发起方 */
  from: number
  /** 接收方 */
  to: number
  /** 发起时间 */
  timestamp: number
}

/** 取消通话请求 */
export interface PeerCallCancel {
  from: number
  to: number
  timestamp: number
  reason?: 'cancel' | 'timeout'
}

/** 响应通话 */
export interface PeerCallResponse {
  action: 'accept' | 'decline' | 'offline' | 'timeout' | 'busy'
  from: number
  to: number
  timestamp: number
  roomID?: string
}

/** 结束通话 */
export interface PeerCallEnd {
  from: number
  to: number
  timestamp: number
}

export const PeerCallType = Object.freeze({
  audio: 'audio',
  video: 'video',
})

export const PeerCallCancelReason = Object.freeze({
  cancel: 'cancel',
  timeout: 'timeout',
})

export const PeerCallResponseAction = Object.freeze({
  accept: 'accept',
  decline: 'decline',
  offline: 'offline',
  timeout: 'timeout',
  busy: 'busy',
})
