import { RoutePath } from '@/configs'
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Form, Input } from 'antd'
import { useNavigate } from 'react-router'

interface FormValues {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export default function Register() {
  const navigate = useNavigate()

  const onFinish = (values: FormValues) => {
    console.log('Received values of form: ', values)
  }

  return (
    <Card title='Register' style={{ margin: '200px auto 0', width: 520 }}>
      <Form<FormValues> name='register' onFinish={onFinish}>
        <Form.Item
          name='username'
          label='Username'
          rules={[{ required: true, message: 'Please input your username!' }]}
        >
          <Input prefix={<UserOutlined />} placeholder='Username' allowClear />
        </Form.Item>
        <Form.Item
          name='email'
          label='Email'
          rules={[
            { type: 'email', message: 'The input is not valid email!' },
            { required: true, message: 'Please input your E-mail!' },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder='Email' allowClear />
        </Form.Item>
        <Form.Item
          name='password'
          label='Password'
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password prefix={<LockOutlined />} type='password' placeholder='Password' allowClear />
        </Form.Item>
        <Form.Item
          name='confirmPassword'
          label='Confirm Password'
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('The new password that you entered do not match!'))
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder='Confirm Password' allowClear />
        </Form.Item>
        <Form.Item style={{ margin: '16px 0 0' }}>
          <Button block type='primary' htmlType='submit'>
            Register
          </Button>
          <Flex align='center'>
            <span>or</span>
            <Button type='link' style={{ padding: '0 4px' }} onClick={() => navigate(RoutePath.Login)}>
              Back to login!
            </Button>
          </Flex>
        </Form.Item>
      </Form>
    </Card>
  )
}
