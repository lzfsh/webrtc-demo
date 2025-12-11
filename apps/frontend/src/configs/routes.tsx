import type { FC } from 'react'
import { Loading } from '@/components'
import { withLazy } from '@/utils'
import { __, curryN } from 'ramda'
import { RoutePath } from './const'

export interface RouteConf {
  path: string
  component: FC
  layout?: boolean
  auth?: boolean
}

const withPageLazy = curryN(2, withLazy)(__, <Loading />)

export const routes: RouteConf[] = [
  {
    path: RoutePath.Login,
    component: withPageLazy(() => import('@/pages/login')),
  },
  {
    path: RoutePath.Register,
    component: withPageLazy(() => import('@/pages/register')),
  },
  {
    path: RoutePath.Home,
    component: withPageLazy(() => import('@/pages/home')),
    layout: true,
    auth: true,
  },
  {
    path: RoutePath.Connect,
    component: withPageLazy(() => import('@/pages/connect')),
    layout: true,
    auth: true,
  },
  {
    path: RoutePath.NotFound,
    component: withPageLazy(() => import('@/pages/not-found')),
  },
]

export const inLayoutRoutes = routes.filter(({ layout }) => layout)
export const outLayoutRoutes = routes.filter(({ layout }) => !layout)
