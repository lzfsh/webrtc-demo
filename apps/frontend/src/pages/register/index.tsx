import { useNavigate } from 'react-router'
import { useRequest } from 'ahooks'
import { __, curryN, omit, pipe } from 'ramda'
import { Button, Card, Form, Input, Space } from 'antd'
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons'
import { RoutePath } from '@/configs'
import { removeEmptyValues, trimObjectStrings } from '@/utils'
import { isSuccess, type RegisterRequest } from '@demo/api'
import { useAuthStore } from '@/stores'
import { useAuthClient } from '@/services'

interface FormValues {
  username: string
  email: string
  password: string
  confirmPassword: string
}

const trimExcludePassword = curryN(2, trimObjectStrings<RegisterRequest>)(__, { exclude: ['password'] })

export default function PageRegister() {
  const navigate = useNavigate()

  const { setUser } = useAuthStore()
  const { loading, runAsync: register } = useRequest(useAuthClient().register, { manual: true })

  const onFinish = async (values: FormValues) => {
    // 1. 去掉空值 2. 去掉 confirmPassword 字段 3. 去掉字符串值左右空格，密码不去
    const transform = pipe(removeEmptyValues<FormValues>, omit(['confirmPassword']), trimExcludePassword)
    const resp = await register(transform(values))
    if (isSuccess(resp) && resp?.data) {
      setUser(resp.data)
      navigate(RoutePath.Home)
    }
  }

  return (
    <Card title='Register' style={{ margin: '200px auto 0', width: 540 }}>
      <Form<FormValues> name='register' onFinish={onFinish}>
        <Form.Item<FormValues>
          label='Username'
          name='username'
          rules={[
            { required: true, message: 'Please input your username!' },
            { whitespace: true, message: 'Username cannot be only whitespace!' },
            { min: 1, max: 50, message: 'Username must be between 1 and 50 characters!' },
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder='Username' allowClear />
        </Form.Item>
        <Form.Item<FormValues>
          label='Email'
          name='email'
          rules={[
            { type: 'email', message: 'Input is not valid email!' },
            { required: true, message: 'Please input your email!' },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder='Email' allowClear />
        </Form.Item>
        <Form.Item<FormValues>
          label='Password'
          name='password'
          rules={[
            { required: true, message: 'Please input your password!' },
            { min: 6, max: 20, message: 'Password must be between 6 and 20 characters long!' },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} type='password' placeholder='Password' allowClear />
        </Form.Item>
        <Form.Item<FormValues>
          label='Confirm Password'
          name='confirmPassword'
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password!' },
            { min: 6, max: 20, message: 'Password must be between 6 and 20 characters long!' },
            ({ getFieldValue }) => ({
              validator: async (_, value) => {
                if (value && getFieldValue('password') !== value) {
                  throw new Error('New password do not match!')
                }
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder='Confirm Password' allowClear />
        </Form.Item>
        <Form.Item style={{ margin: '16px 0 0' }}>
          <Button type='primary' htmlType='submit' block loading={loading}>
            Register
          </Button>
          <Space align='center'>
            <span>or</span>
            <Button type='link' style={{ padding: '0 4px' }} onClick={() => navigate(RoutePath.Login)}>
              Back to login!
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}
