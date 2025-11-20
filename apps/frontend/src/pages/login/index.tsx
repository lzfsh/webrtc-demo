import { RoutePath } from '@/configs'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Form, Input } from 'antd'
import { useNavigate } from 'react-router'

interface FormValues {
  username: string
  email: string
}

export default function Login() {
  const navigate = useNavigate()

  const onFinish = (values: FormValues) => {
    console.log('Received values of form: ', values)
  }

  return (
    <Card title='Login' style={{ margin: '200px auto 0', width: 420 }}>
      <Form<FormValues> name='login' onFinish={onFinish}>
        <Form.Item name='username' rules={[{ required: true, message: 'Please input your username!' }]}>
          <Input prefix={<UserOutlined />} placeholder='Username' allowClear />
        </Form.Item>
        <Form.Item name='password' rules={[{ required: true, message: 'Please input your password!' }]}>
          <Input.Password prefix={<LockOutlined />} type='password' placeholder='Password' allowClear />
        </Form.Item>
        <Form.Item style={{ margin: '16px 0 0' }}>
          <Button block type='primary' htmlType='submit'>
            Log in
          </Button>
          <Flex align='center'>
            <span>or</span>
            <Button type='link' style={{ padding: '0 4px' }} onClick={() => navigate(RoutePath.Register)}>
              Register now!
            </Button>
          </Flex>
        </Form.Item>
      </Form>
    </Card>
  )
}
