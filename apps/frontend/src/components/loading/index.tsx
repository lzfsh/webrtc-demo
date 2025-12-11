import { Spin } from 'antd'

export function Loading() {
  return (
    <Spin style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} size='large' />
  )
}
