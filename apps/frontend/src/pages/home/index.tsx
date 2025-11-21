import { Button, Flex, Form, Input, Select, Space, Tooltip } from 'antd'
import { RedoOutlined, SearchOutlined } from '@ant-design/icons'
import { LoginStatus, type ILoginStatus } from '@demo/api'
import { Layout } from '@/layout'
import { cleanEmptyField } from '@/utils'
import { UserCard } from './user-card'

interface FormValues {
  id: string
  email: string
  username: string
  loginStatus: ILoginStatus
}

export default function Home() {
  const [form] = Form.useForm<FormValues>()

  const onFinish = async (values: FormValues) => {
    // 记得去空格
    console.log('Received values of form: ', cleanEmptyField(values))
  }

  const onReset = () => {
    form.resetFields()
    form.submit()
  }

  return (
    <Layout>
      <Flex style={{ height: 'calc(100vh - 64px)' }} vertical align='start' gap={8}>
        <div style={{ height: '54px' }}>
          <Form<FormValues> form={form} name='home' layout='inline' style={{ width: '100%' }} onFinish={onFinish}>
            <Form.Item<FormValues>
              label='ID'
              name={'id'}
              rules={[
                {
                  validator: async (_, val) => {
                    if (val == void 0) return
                    const ret = Number(val?.trim())
                    if (!Number.isInteger(ret) || ret <= 0) {
                      throw new Error('ID must be a positive integer!')
                    }
                  },
                },
              ]}
            >
              <Input style={{ width: 280 }} placeholder='ID' allowClear />
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
                  <Button icon={<SearchOutlined />} htmlType='submit' loading={false} />
                </Tooltip>
                <Tooltip title={'reset'}>
                  <Button icon={<RedoOutlined />} loading={false} onClick={onReset} />
                </Tooltip>
              </Space>
            </Form.Item>
          </Form>
        </div>

        <Flex style={{ width: '100%' }} align='center' wrap gap={16}>
          <UserCard
            info={{
              id: 1,
              email: 'user1@example.com',
              username: 'user1',
              loginStatus: LoginStatus.Online,
              createdAt: new Date().getTime(),
              updatedAt: new Date().getTime(),
            }}
            onConnect={(info) => console.log(info)}
          />
        </Flex>
      </Flex>
    </Layout>
  )
}
