import { useNavigate } from 'react-router'
import type { PropsWithChildren } from 'react'
import { Layout as AntdLayout, Avatar, Button, Flex, Space, Typography } from 'antd'
import { RoutePath } from '@/configs'

const { Header, Content } = AntdLayout
const { Title } = Typography

export function Layout({ children }: PropsWithChildren) {
  const navigate = useNavigate()

  const logout = () => {
    navigate(RoutePath.Login)
  }

  return (
    <AntdLayout>
      <Header>
        <Flex style={{ height: '100%' }} justify='space-between' align='center'>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>
            WebRTC Demo
          </Title>

          <Space align='center' size={12}>
            <Button type='primary' danger onClick={logout}>
              Logout
            </Button>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>User</span>
            <Avatar style={{ backgroundColor: '#f56a00' }} size='large'>
              U
            </Avatar>
          </Space>
        </Flex>
      </Header>
      <Content style={{ padding: 16 }}>{children}</Content>
    </AntdLayout>
  )
}
