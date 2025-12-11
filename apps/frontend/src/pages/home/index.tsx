import { useMemo } from 'react'
import { useRequest } from 'ahooks'
import { useOutletContext } from 'react-router'
import { Button, Flex, Form, Input, Select, Space, Tooltip, Typography } from 'antd'
import { RedoOutlined, SearchOutlined } from '@ant-design/icons'
import { pipe } from 'ramda'
import { Code, LoginStatus, type ILoginStatus, type ListUserRequest } from '@demo/api'
import { useAuthStore } from '@/stores'
import { useDocumentTitle } from '@/hooks'
import { removeEmptyValues, trimObjectStrings } from '@/utils'
import { Loading } from '@/components'
import { useUserClient } from '@/services'
import { useIncomingCall, useOutgoingCall } from './hooks'
import { UserCard } from './components'
import type { OutletContext } from '@/layout'

const { Text } = Typography

interface FormValues {
  id: string
  email: string
  username: string
  loginStatus: ILoginStatus
}

export default function PageHome() {
  const [form] = Form.useForm<FormValues>()

  const { user } = useAuthStore()
  const { ws } = useOutletContext<OutletContext>()
  useDocumentTitle(user?.username ?? 'Home')

  const { videoCall, audioCall } = useOutgoingCall(user!, ws)
  useIncomingCall(user!, ws)

  const { loading, data: response, run: listUser } = useRequest(useUserClient().listUser)
  const users = useMemo(() => (response?.code === Code.Ok && response?.data ? response.data : []), [response])

  const onFinish = (values: FormValues) => {
    // 1. 重新映射 Id 字段为 Number 类型 2. 去空值 3. 去掉字符串值左右空格，密码不去
    const transform = pipe(
      (values: FormValues): ListUserRequest => ({
        id: values.id ? Number(values.id) : void 0,
        email: values.email,
        username: values.username,
        loginStatus: values.loginStatus,
      }),
      removeEmptyValues<ListUserRequest>,
      trimObjectStrings<ListUserRequest>,
    )
    listUser(transform(values))
  }

  const onReset = () => {
    form.resetFields()
    form.submit()
  }

  return (
    <Flex style={{ height: 'calc(100vh - 64px)' }} vertical align='start'>
      <div style={{ height: '54px' }}>
        <Form<FormValues> form={form} name='home' layout='inline' style={{ width: '100%' }} onFinish={onFinish}>
          <Form.Item<FormValues>
            label='ID'
            name={'id'}
            rules={[
              {
                validator: async (_, val) => {
                  if (!val) return
                  const ret = Number(val?.trim())
                  if (!Number.isInteger(ret) || ret <= 0) {
                    throw new Error('Id must be a positive integer!')
                  }
                },
              },
            ]}
          >
            <Input style={{ width: 280 }} placeholder='Id' allowClear />
          </Form.Item>
          <Form.Item<FormValues>
            label='Email'
            name={'email'}
            rules={[{ type: 'email', message: 'Input is not valid email!' }]}
          >
            <Input style={{ width: 280 }} placeholder='Email' allowClear />
          </Form.Item>
          <Form.Item<FormValues>
            label='Username'
            name={'username'}
            rules={[
              { whitespace: true, message: 'Username cannot be only whitespace!' },
              { min: 1, max: 50, message: 'Username must be between 1 and 50 characters!' },
            ]}
          >
            <Input style={{ width: 280 }} placeholder='Username' allowClear />
          </Form.Item>
          <Form.Item<FormValues> label='Login Status' name={'loginStatus'}>
            <Select
              style={{ width: 280 }}
              placeholder='Login status'
              allowClear
              options={[
                { label: 'Online', value: LoginStatus.Online },
                { label: 'Offline', value: LoginStatus.Offline },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Tooltip title='search'>
                <Button icon={<SearchOutlined />} htmlType='submit' loading={loading} />
              </Tooltip>
              <Tooltip title={'reset'}>
                <Button icon={<RedoOutlined />} loading={false} onClick={onReset} />
              </Tooltip>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <Flex style={{ width: '100%' }} align='center' wrap gap={16}>
        {!loading ? (
          users.length > 0 ? (
            users.map((user) => <UserCard key={user.id} info={user} onAudioCall={audioCall} onVideoCall={videoCall} />)
          ) : (
            <Text>No user found.</Text>
          )
        ) : (
          <Loading />
        )}
      </Flex>
    </Flex>
  )
}
