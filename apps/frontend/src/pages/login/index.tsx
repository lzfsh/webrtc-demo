import { useNavigate } from 'react-router'
import { pipe, __, curryN } from 'ramda'
import { useRequest } from 'ahooks'
import { Button, Card, Form, Input, Space } from 'antd'
import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { RoutePath } from '@/configs'
import { useAuthStore } from '@/stores'
import { removeEmptyValues, trimObjectStrings } from '@/utils'
import { isSuccess } from '@demo/api'
import { useAuthClient } from '@/services'

interface FormValues {
  email: string
  password: string
}

const trimExcludePassword = curryN(2, trimObjectStrings<FormValues>)(__, { exclude: ['password'] })

export default function PageLogin() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const { loading, runAsync: login } = useRequest(useAuthClient().login, { manual: true })

  const onFinish = async (values: FormValues) => {
    // 1. 去掉空值 2. 去掉字符串值左右空格，密码不去
    const transform = pipe(removeEmptyValues<FormValues>, trimExcludePassword)
    const resp = await login(transform(values))
    if (isSuccess(resp) && resp?.data) {
      setUser(resp.data)
      navigate(RoutePath.Home)
    }
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
          <Button type='primary' htmlType='submit' block loading={loading}>
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
