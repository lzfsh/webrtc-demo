import { useRef } from 'react'
import { useUnmount } from 'ahooks'
import { Button, Space } from 'antd'
import type { User } from '@demo/api'
import { CallAnswerAction, CallType, DisconnectReason, type Call, type CallAnswer } from '@demo/ws'
import { useListener, useMessage, useNotification } from '@/hooks'
import { Connect, type ConnectSearchParams } from '@/configs'
import { WebSocketSrvEvent, type WebSocketService } from '@/services'
import type { UserCardProps } from '../components'
import { useOutgoingModal } from './use-outgoing-modal'

export const CALL_TIMEOUT = (60 + 30) * 1000

export function useOutgoingCall(caller: User, ws: WebSocketService) {
  const message = useMessage()
  const { open: openOutgoingModal, close: closeOutgoingModal } = useOutgoingModal()

  const calleeRef = useRef<UserCardProps['info']>(null)
  const typeRef = useRef<Call['type']>(CallType.Audio)
  const hasCancelCallRef = useRef(true)

  const cancelCall = () => {
    if (calleeRef.current) {
      hasCancelCallRef.current = true
      ws.forwardCallCancelled(calleeRef.current.id)
      calleeRef.current = null
    }
  }

  const call = (callee: UserCardProps['info'], type: Call['type'] = CallType.Audio) => {
    if (![CallType.Audio, CallType.Video].includes(type)) return

    // 1. 取消之前的通话请求
    cancelCall()
    // 2. 存储当前通话对象
    calleeRef.current = callee
    hasCancelCallRef.current = false
    typeRef.current = type
    // 3. 发起通话请求
    ws.forwardCall(callee.id, type)
    // 4. 打开等待弹窗
    openOutgoingModal({
      callee,
      timeout: CALL_TIMEOUT,
      onClose: (reason) => {
        if (reason) {
          cancelCall()
        } else {
          calleeRef.current = null
        }
      },
    })
  }

  const videoCall = (callee: UserCardProps['info']) => {
    call(callee, CallType.Video)
  }

  const audioCall = (callee: UserCardProps['info']) => {
    call(callee, CallType.Audio)
  }

  useListener(ws, WebSocketSrvEvent.CallAnswer, ({ payload }) => {
    const { action, from: calleeId, to: callerId, room, reason } = payload
    if (callerId !== caller.id) return
    if (!calleeRef.current || calleeRef.current.id !== calleeId) return

    closeOutgoingModal({ unmount: { delay: 0 } })
    if (action === CallAnswerAction.Accept) {
      Connect.openInBlank({ room: room!, type: typeRef.current, caller: callerId, callee: calleeId })
    } else if (reason) {
      message.info(`User ${calleeRef.current.username} is ${reason.toLowerCase()}`)
    }
  })

  useUnmount(() => {
    closeOutgoingModal({ unmount: { delay: 0 } })
    if (!hasCancelCallRef.current) {
      cancelCall()
    }
  })

  return { call, videoCall, audioCall, cancelCall }
}

export function useIncomingCall(callee: User, ws: WebSocketService) {
  const message = useMessage()
  const notification = useNotification()
  const callerIds = useRef<(string | number)[]>([])

  const destroyNotification = (key?: string | number) => {
    if (key) {
      callerIds.current = callerIds.current.filter((k) => k !== key)
      notification.destroy(key)
    } else {
      notification.destroy()
      callerIds.current = []
    }
  }

  const acceptCall = (from: CallAnswer['from'], searchParams: ConnectSearchParams) => {
    ws.forwardCallAccepted(from)
    destroyNotification(from)
    Connect.openInBlank(searchParams)
  }

  const declineCall = (from: CallAnswer['from']) => {
    ws.forwardCallDeclined(from)
    destroyNotification(from)
  }

  useListener(ws, WebSocketSrvEvent.Call, ({ payload }) => {
    const { from: callerId, to: calleeId, type, room } = payload
    if (calleeId !== callee.id) return

    callerIds.current.push(callerId)
    notification.info({
      key: callerId,
      message: `Incoming ${type} call from ${callerId}...`,
      closable: false,
      duration: CALL_TIMEOUT / 1000,
      showProgress: true,
      actions: (
        <Space>
          <Button
            type='primary'
            onClick={() => acceptCall(callerId, { room: room!, type, caller: callerId, callee: calleeId })}
          >
            Accept
          </Button>
          <Button onClick={() => declineCall(callerId)}>Decline</Button>
        </Space>
      ),
    })
  })

  useListener(ws, WebSocketSrvEvent.CancelCall, ({ payload }) => {
    const { from: callerId, to: calleeId, reason } = payload
    if (calleeId !== callee.id) return

    destroyNotification(callerId)
    if (reason === DisconnectReason.Handled) {
      message.info('The call has already been handled on other client')
    }
  })

  useUnmount(() => {
    callerIds.current.forEach((callerId) => declineCall(callerId))
  })
}
