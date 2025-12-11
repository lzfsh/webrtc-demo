import { PhoneOutlined, VideoCameraOutlined } from '@ant-design/icons'
import { LoginStatus, type UserWithLoginStatus } from '@demo/api'
import { Avatar, Badge, Button, Card, Flex, Space, Typography } from 'antd'
import { useMemo } from 'react'

const { Text } = Typography

const DEFAULT_ROW = 5

const labels = Object.freeze({
  [LoginStatus.Online]: 'Online',
  [LoginStatus.Offline]: 'Offline',
})

const badges = Object.freeze({
  [LoginStatus.Online]: 'success',
  [LoginStatus.Offline]: 'default',
})

export interface UserCardProps {
  row?: number
  info: UserWithLoginStatus
  onAudioCall?: (info: UserCardProps['info']) => void
  onVideoCall?: (info: UserCardProps['info']) => void
}
export function UserCard({ row = DEFAULT_ROW, info, onAudioCall, onVideoCall }: UserCardProps) {
  const width = useMemo(() => `calc((100% - (16px * ${row - 1})) / ${row})`, [row])

  const [loginStatus, badgeStatus] = useMemo(
    () => [labels[info.loginStatus], badges[info.loginStatus]],
    [info.loginStatus],
  )

  return (
    <Card
      title={info.username}
      style={{ width }}
      extra={
        <Space size={8}>
          <Button
            type='primary'
            icon={<PhoneOutlined />}
            disabled={info.loginStatus === LoginStatus.Offline}
            loading={false}
            title='Audio Call'
            onClick={() => onAudioCall?.(info)}
          />
          <Button
            type='primary'
            icon={<VideoCameraOutlined />}
            disabled={info.loginStatus === LoginStatus.Offline}
            loading={false}
            title='Video Call'
            onClick={() => onVideoCall?.(info)}
          />
        </Space>
      }
    >
      <Flex justify='space-between' align='center'>
        <Avatar style={{ flexShrink: 0, backgroundColor: '#f56a00' }} size={60}>
          {info.username[0]}
        </Avatar>
        <Space style={{ flexShrink: 0 }} direction='vertical' size={4}>
          <Text>Username: {info.username}</Text>
          <Text>Email: {info.email}</Text>
          <Space size={4}>
            <Badge status={badgeStatus} />
            <Text>{loginStatus}</Text>
          </Space>
        </Space>
      </Flex>
    </Card>
  )
}
