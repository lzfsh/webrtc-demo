import { RoutePath } from '@/configs'
import { cleanEmptyField } from '@/utils'
import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, Space } from 'antd'
import { useNavigate } from 'react-router'

interface FormValues {
  email: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()

  const onFinish = (values: FormValues) => {
    // 去空格，密码不去
    console.log('Received values of form: ', cleanEmptyField(values))
  }

  return (
    <Card title='Login' style={{ margin: '200px auto 0', width: 420 }}>
      <Form<FormValues> name='login' onFinish={onFinish}>
        <Form.Item<FormValues>
          name='email'
          rules={[
            { type: 'email', message: 'Input is not valid email!' },
            { required: true, message: 'Please input your email!' },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder='Email' allowClear />
        </Form.Item>
        <Form.Item<FormValues>
          name='password'
          rules={[
            { required: true, message: 'Please input your password!' },
            { min: 6, max: 20, message: 'Password must be between 6 and 20 characters long!' },
          ]}
        >
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
