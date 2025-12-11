import { useNavigate } from 'react-router'
import { Button, Result } from 'antd'
import { RoutePath } from '@/configs'

export default function PageNotFound() {
  const navigate = useNavigate()

  return (
    <Result
      status='404'
      title='404'
      subTitle='Sorry, the page you visited does not exist.'
      extra={
        <Button type='primary' onClick={() => navigate(RoutePath.Home)}>
          Back Home
        </Button>
      }
    />
  )
}
