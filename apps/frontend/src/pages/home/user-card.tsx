import { LoginStatus, type UserWithLoginStatus } from '@demo/api'
import { Avatar, Badge, Button, Card, Flex, Space, Typography } from 'antd'
import { useMemo } from 'react'

const { Text } = Typography

const defaultRow = 5

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
  onConnect?: (info: UserCardProps['info']) => void
}
export function UserCard({ row = defaultRow, info, onConnect }: UserCardProps) {
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
        <Button
          type='primary'
          disabled={info.loginStatus === LoginStatus.Offline}
          loading={false}
          onClick={() => onConnect?.(info)}
        >
          Connect
        </Button>
      }
    >
      <Flex justify='space-between' align='center'>
        <Avatar style={{ backgroundColor: '#f56a00' }} size={60}>
          {info.username[0]}
        </Avatar>
        <Space direction='vertical' size={4}>
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
