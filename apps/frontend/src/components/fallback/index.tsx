import { type FallbackProps } from 'react-error-boundary'
import { Button, Flex, Typography, Space } from 'antd'

const { Title, Text } = Typography

export function Fallback({ error }: FallbackProps) {
  // 根据换行分割，并去掉空格
  const stacks: string[] = error?.stack?.toString()?.split(/\s*\n\s*/m) ?? []

  const refresh = () => {
    globalThis.location.reload()
  }

  return (
    <Flex style={{ margin: '0 auto', paddingTop: 80, width: 900 }} vertical align='start' gap={8}>
      <Title style={{ margin: 0 }} level={2}>
        Something went wrong!
      </Title>
      <Title style={{ margin: 0 }} level={4} type='danger'>
        {error.message}
      </Title>
      {/* eslint-disable-next-line @eslint-react/dom/no-dangerously-set-innerhtml */}
      <Space direction='vertical' style={{ width: 900 }} align='start' size={0}>
        {stacks.length > 0 &&
          stacks.map((stack) => (
            <Text key={stack} type='danger'>
              {stack}
            </Text>
          ))}
      </Space>
      <Button type='primary' onClick={refresh}>
        Try Again!
      </Button>
    </Flex>
  )
}
