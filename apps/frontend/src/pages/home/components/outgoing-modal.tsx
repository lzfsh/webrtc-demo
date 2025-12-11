import { Avatar, Button, Flex, Modal, Typography } from 'antd'
import type { User } from '@demo/api'
import { DisconnectReason, type CancelCall } from '@demo/ws'
import { useTimeout } from 'ahooks'
import type { PopupProps } from '@/hooks'

const { Text } = Typography

export interface OutgoingModalProps extends PopupProps {
  callee?: User
  timeout?: number
  onClose?: (reason?: CancelCall['reason']) => any | Promise<any>
}

export function OutgoingModal(props: OutgoingModalProps) {
  const { open = false, timeout, callee, onClose } = props
  const username = callee?.username ?? 'unknown'

  useTimeout(() => onClose?.(DisconnectReason.Timeout), timeout)

  return (
    <Modal
      width={300}
      title={`Calling ${username}...`}
      styles={{ footer: { display: 'flex', justifyContent: 'center' } }}
      open={open}
      closable={false}
      maskClosable={false}
      keyboard={false}
      onCancel={() => onClose?.()}
      footer={
        <Button type='primary' danger key='cancel' onClick={() => onClose?.()}>
          Hang up
        </Button>
      }
    >
      <Flex style={{ padding: '24px 0' }} vertical align='center' gap={16}>
        <Avatar size={60}>{username}</Avatar>
        <Text>Please wait for the response</Text>
      </Flex>
    </Modal>
  )
}
