import { type FC, type PropsWithChildren, type ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useRequest } from 'ahooks'
import { isSuccess } from '@demo/api'
import { RoutePath } from '@/configs'
import { useAuthStore } from '@/stores'
import { Loading } from '@/components'
import { useUserClient } from '@/services'

export type AuthProps = PropsWithChildren & {
  fallback?: ReactNode
}

export function AuthGuarder({ children, fallback }: AuthProps) {
  const { token } = useAuthStore()
  if (!token) return fallback ?? null
  return children
}

export function AuthForwarder({ fallback, children }: AuthProps) {
  const { user, setUser } = useAuthStore()
  const { loading } = useRequest(useUserClient().getUser, {
    // store 只有 token 持久化存储了，初始化时如果没有 user 信息，这需要从接口获取
    manual: !!user,
    onSuccess: (resp) => {
      if (isSuccess(resp) && resp?.data) setUser(resp.data)
    },
  })
  return loading ? fallback : children
}

export function RouteAuthGuarder({ children }: Pick<AuthProps, 'children'>) {
  return (
    <AuthGuarder fallback={<Navigate to={RoutePath.Login} replace />}>
      <AuthForwarder fallback={<Loading />}>{children}</AuthForwarder>
    </AuthGuarder>
  )
}

export function WithAuthGuarder<P extends object>(Comp: FC<P>, opts: Pick<AuthProps, 'fallback'> = {}) {
  return (props: P) => (
    <AuthGuarder {...opts}>
      <Comp {...props} />
    </AuthGuarder>
  )
}
