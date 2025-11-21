import { RoutePath } from '@/configs'
import { cleanEmptyField } from '@/utils'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, Space } from 'antd'
import { useNavigate } from 'react-router'

interface FormValues {
  username: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()

  const onFinish = (values: FormValues) => {
    console.log('Received values of form: ', cleanEmptyField(values))
  }

  return (
    <Card title='Login' style={{ margin: '200px auto 0', width: 420 }}>
      <Form<FormValues> name='login' onFinish={onFinish}>
        <Form.Item<FormValues> name='username' rules={[{ required: true, message: 'Please input your username!' }]}>
          <Input prefix={<UserOutlined />} placeholder='Username' allowClear />
        </Form.Item>
        <Form.Item<FormValues> name='password' rules={[{ required: true, message: 'Please input your password!' }]}>
          <Input.Password prefix={<LockOutlined />} type='password' placeholder='Password' allowClear />
        </Form.Item>
        <Form.Item style={{ margin: '16px 0 0' }}>
          <Button type='primary' htmlType='submit' block loading={false}>
            Log in
          </Button>
          <Space align='center'>
            <span>or</span>
            <Button type='link' style={{ padding: '0 4px' }} onClick={() => navigate(RoutePath.Register)}>
              Register now!
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}
