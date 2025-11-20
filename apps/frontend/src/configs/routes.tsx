import { lazy } from 'react'
import { RoutePath } from './const'

export interface RouteConf {
  path: string
  component: React.FC
}

export const routes: RouteConf[] = [
  {
    path: RoutePath.Login,
    component: lazy(() => import('@/pages/login')),
  },
  {
    path: RoutePath.Register,
    component: lazy(() => import('@/pages/register')),
  },
  {
    path: RoutePath.Home,
    component: lazy(() => import('@/pages/home')),
  },
  {
    path: RoutePath.Connect,
    component: lazy(() => import('@/pages/connect')),
  },
  {
    path: RoutePath.NotFound,
    component: lazy(() => import('@/pages/not-found')),
  },
]
