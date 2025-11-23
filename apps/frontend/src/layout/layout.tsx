import { Outlet, useNavigate } from 'react-router'
import { Layout as AntdLayout, Avatar, Button, Flex, Space, Typography } from 'antd'
import { RoutePath } from '@/configs'
import { useAuthStore } from '@/hooks'
import { AuthGuarder } from '@/components'

const { Header, Content } = AntdLayout
const { Title } = Typography

export function Layout() {
  const navigate = useNavigate()
  const authStore = useAuthStore()
  const { user } = authStore

  const logout = () => {
    authStore.clear()
    navigate(RoutePath.Login)
  }

  return (
    <AntdLayout>
      <Header>
        <Flex style={{ height: '100%' }} justify='space-between' align='center'>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>
            WebRTC Demo
          </Title>

          <AuthGuarder
            fallback={
              <Button type='primary' danger onClick={() => navigate(RoutePath.Login)}>
                Login
              </Button>
            }
          >
            <Space align='center' size={12}>
              {user && (
                <>
                  <Button type='primary' danger onClick={logout}>
                    Logout
                  </Button>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{user.username}</span>
                  <Avatar style={{ backgroundColor: '#f56a00' }} size='large'>
                    {user.username[0]}
                  </Avatar>
                </>
              )}
            </Space>
          </AuthGuarder>
        </Flex>
      </Header>
      <Content style={{ padding: 16 }}>
        <Outlet />
      </Content>
    </AntdLayout>
  )
}
