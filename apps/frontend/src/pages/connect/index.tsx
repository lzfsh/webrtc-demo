import { Layout } from '@/layout'
import { Button, Flex } from 'antd'
import { useEffect } from 'react'

export default function Connect() {
  useEffect(() => {
    // dosomething
  }, [])

  return (
    <Layout>
      <Flex vertical align='center' gap={16}>
        <div id='player' style={{ width: '100%', height: '600px', backgroundColor: '#000' }}></div>
        <Button type='primary' danger>
          Hang up
        </Button>
      </Flex>
    </Layout>
  )
}
